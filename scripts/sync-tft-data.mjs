// TFT 데이터 동기화 스크립트
//
//   node scripts/sync-tft-data.mjs          -> 기본 세트(SET_NUMBER) 갱신
//   SET=18 node scripts/sync-tft-data.mjs   -> 다음 시즌으로 전환
//
// Community Dragon의 통합 JSON(약 24MB)을 받아 필요한 부분만 추려
// public/data/set{N}.json 으로 저장하고, 아이콘 이미지를 public/img 아래에 내려받는다.

import { mkdir, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SET_NUMBER = Number(process.env.SET || 17)

const SOURCE = 'https://raw.communitydragon.org/latest/cdragon/tft/ko_kr.json'
const GAME_CDN = 'https://raw.communitydragon.org/latest/game/'

// 조합용 기본 아이템 10종
const COMPONENTS = [
  'TFT_Item_BFSword',
  'TFT_Item_RecurveBow',
  'TFT_Item_NeedlesslyLargeRod',
  'TFT_Item_TearOfTheGoddess',
  'TFT_Item_ChainVest',
  'TFT_Item_NegatronCloak',
  'TFT_Item_GiantsBelt',
  'TFT_Item_SparringGloves',
  'TFT_Item_Spatula',
  'TFT_Item_FryingPan',
]
const COMPONENT_SET = new Set(COMPONENTS)

// 특성 단계 색상. effects[].style 값 기준 (데이터에서 실제로 쓰이는 값만 등장)
const STYLE_MAP = { 0: 'none', 1: 'bronze', 2: 'silver', 3: 'silver', 4: 'unique', 5: 'gold', 6: 'prismatic' }

// desc 안에 %i:scaleAP% 형태로 박혀 있는 아이콘 표기를 한글 라벨로 바꾼다
const SCALE_LABELS = {
  scaleap: 'AP',
  scalead: 'AD',
  scalehealth: '체력',
  scalearmor: '방어력',
  scalemr: '마법저항력',
  scalemana: '마나',
  scaleattackspeed: '공격속도',
  scalecrit: '치명타',
  scaledodge: '회피',
}

const log = (...args) => console.log('[sync]', ...args)

/** 아이콘 경로(.tex/.dds)를 Community Dragon의 실제 png 경로로 바꾼다 */
function iconPath(raw) {
  if (!raw || raw === 'None') return null
  return raw.toLowerCase().replace(/\.(tex|dds)$/, '.png')
}

/** 소수점 둘째 자리까지만 남기고 정수면 정수로 */
function tidyNumber(n) {
  return String(Math.round(n * 100) / 100)
}

/**
 * @Variable@ / @Variable*100@ 치환 + 마크업 정리 → 순수 텍스트
 *
 * 값을 찾지 못한 토큰(@ModifiedAS@ 처럼 게임 안에서 계산되는 것들)은
 * 그대로 두면 화면에 깨져 보이므로 지운다.
 */
function cleanDesc(desc, vars = {}) {
  if (!desc) return ''

  // 변수 조회는 대소문자를 가리지 않게
  const lookup = {}
  for (const [k, v] of Object.entries(vars || {})) lookup[k.toLowerCase()] = v

  // 값을 못 찾은 자리는 일단 표식을 남겼다가, 뒤에 붙은 "%"까지 함께 지운다.
  // (그냥 지우면 "공격 속도를 % 얻습니다" 처럼 기호만 남는다)
  const MISSING = '\u0000'

  let out = desc.replace(/@([^@]+)@/g, (whole, expr) => {
    const m = expr.match(/^([^*]+?)(?:\*(-?[\d.]+))?$/)
    if (!m) return MISSING
    const key = m[1].trim().toLowerCase()
    const mul = m[2] ? Number(m[2]) : 1
    const val = lookup[key]
    if (val === undefined || val === null) return MISSING
    // 별 등급별로 값이 다른 경우 "120/180/285" 형태로 이어 붙인다
    if (Array.isArray(val)) return val.map((v) => tidyNumber(v * mul)).join('/')
    if (typeof val !== 'number') return String(val)
    return tidyNumber(val * mul)
  })

  out = out
    // 값이 비어 있는 자리는 뒤따라오는 % 기호까지 함께 걷어낸다
    .replace(/\u0000\s*%/g, '')
    .replace(/\u0000/g, '')
    .replace(/%i:([a-zA-Z]+)%/g, (whole, name) => {
      const label = SCALE_LABELS[name.toLowerCase()]
      return label ? ` ${label}` : ''
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/row>/gi, '\n')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+([%,.])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim()

  return out
}

/** 특성 설명: <row> 한 줄이 effects 한 단계에 대응하므로 @MinUnits@를 순서대로 채운다 */
function cleanTraitDesc(desc, effects) {
  if (!desc) return ''
  let i = 0
  const filled = desc.replace(/@MinUnits@/g, () => {
    const eff = effects[i++]
    return eff ? String(eff.minUnits) : '?'
  })
  // 단계별 변수는 대부분 동일하므로 전부 합쳐서 조회 테이블로 쓴다
  const vars = Object.assign({}, ...effects.map((e) => e.variables || {}))
  return cleanDesc(filled, vars)
}

/**
 * 스킬 설명용 변수 테이블.
 * value 배열은 별 등급별 수치이고 1/2/3번 칸이 1성/2성/3성에 해당한다.
 * 세 값이 같으면 하나로, 다르면 "1성/2성/3성" 형태로 묶는다.
 */
function abilityVars(ability) {
  const out = {}
  for (const v of ability?.variables || []) {
    const stars = [v.value?.[1], v.value?.[2], v.value?.[3]].filter((n) => typeof n === 'number')
    if (!stars.length) continue
    out[v.name] = stars.every((n) => n === stars[0]) ? stars[0] : stars
  }
  return out
}

async function fetchJson(url) {
  log('데이터 내려받는 중...', url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`데이터 요청 실패: ${res.status}`)
  const text = await res.text()
  log(`받음: ${(text.length / 1024 / 1024).toFixed(1)}MB`)
  return JSON.parse(text)
}

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

/** 이미지 다운로드. 이미 있으면 건너뛴다. */
async function downloadImage(remotePath, destFile) {
  if (await exists(destFile)) return 'skip'
  const res = await fetch(GAME_CDN + remotePath)
  if (!res.ok) return 'fail'
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(destFile, buf)
  return 'ok'
}

/** 동시 실행 개수를 제한한 다운로드 큐 */
async function downloadAll(jobs, concurrency = 12) {
  const stats = { ok: 0, skip: 0, fail: 0 }
  let cursor = 0
  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < jobs.length) {
      const job = jobs[cursor++]
      try {
        stats[await downloadImage(job.remote, job.dest)]++
      } catch {
        stats.fail++
      }
    }
  })
  await Promise.all(workers)
  return stats
}

async function main() {
  const raw = await fetchJson(SOURCE)
  const set = raw.sets[String(SET_NUMBER)]
  if (!set) throw new Error(`세트 ${SET_NUMBER} 데이터를 찾을 수 없습니다.`)

  const prefix = `TFT${SET_NUMBER}_`

  // ---- 특성 ----------------------------------------------------------------
  // 같은 이름의 특성이 여러 개인 경우(예: 별돌보미의 내부 변형들) apiName이 가장
  // 짧은 것을 대표로 쓴다.
  const traitByName = new Map()
  for (const t of set.traits) {
    const prev = traitByName.get(t.name)
    if (!prev || t.apiName.length < prev.apiName.length) traitByName.set(t.name, t)
  }

  // ---- 챔피언 --------------------------------------------------------------
  // 골렘/훈련봇 같은 비플레이 유닛을 걸러낸다 (해당 세트 prefix + 특성 보유)
  const champions = set.champions
    .filter((c) => c.apiName.startsWith(prefix) && (c.traits || []).length > 0)
    .map((c) => ({
      id: c.apiName,
      // 특성만 바꿔 단 변형 유닛(미스 포츈의 "특성 선택" 같은 것)은 이름이 원본과
      // 똑같아서 목록에서 구별되지 않는다. 붙은 특성을 이름 뒤에 적어 준다.
      name: c.apiName.endsWith('_TraitClone') ? `${c.name} (${c.traits[c.traits.length - 1]})` : c.name,
      cost: c.cost,
      traits: c.traits,
      icon: iconPath(c.tileIcon),
      ability: c.ability
        ? { name: c.ability.name, desc: cleanDesc(c.ability.desc, abilityVars(c.ability)) }
        : null,
      stats: c.stats
        ? {
            hp: Math.round(c.stats.hp || 0),
            damage: Math.round(c.stats.damage || 0),
            armor: Math.round(c.stats.armor || 0),
            mr: Math.round(c.stats.magicResist || 0),
            attackSpeed: Math.round((c.stats.attackSpeed || 0) * 100) / 100,
            range: c.stats.range || 1,
            mana: c.stats.mana || 0,
            initialMana: c.stats.initialMana || 0,
          }
        : null,
    }))
    .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name, 'ko'))

  // 챔피언이 실제로 쓰는 특성만 남긴다
  const usedTraitNames = new Set(champions.flatMap((c) => c.traits))
  const traits = [...traitByName.values()]
    .filter((t) => usedTraitNames.has(t.name))
    .map((t) => {
      const effects = (t.effects || [])
        .slice()
        .sort((a, b) => a.minUnits - b.minUnits)
        .map((e) => ({
          min: e.minUnits,
          max: e.maxUnits >= 25000 ? null : e.maxUnits,
          style: STYLE_MAP[e.style] || 'bronze',
        }))
      return {
        id: t.apiName,
        name: t.name,
        icon: iconPath(t.icon),
        desc: cleanTraitDesc(t.desc, (t.effects || []).slice().sort((a, b) => a.minUnits - b.minUnits)),
        effects,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))

  // ---- 아이템 --------------------------------------------------------------
  const itemById = new Map(raw.items.map((i) => [i.apiName, i]))
  const toItem = (i, extra = {}) => ({
    id: i.apiName,
    name: i.name,
    icon: iconPath(i.icon),
    desc: cleanDesc(i.desc, i.effects),
    from: (i.composition || []).map((c) => {
      const src = itemById.get(c)
      return { id: c, name: src?.name || c, icon: iconPath(src?.icon) }
    }),
    unique: !!i.unique,
    ...extra,
  })

  const components = COMPONENTS.map((id) => itemById.get(id))
    .filter(Boolean)
    .map((i) => toItem(i))

  const combined = raw.items
    .filter(
      (i) =>
        /^TFT_Item_/.test(i.apiName) &&
        !i.isAugment &&
        !/Emblem/i.test(i.apiName) &&
        !/^TFT_Item_Corrupted/.test(i.apiName) &&
        (i.composition || []).length === 2 &&
        i.composition.every((c) => COMPONENT_SET.has(c))
    )
    .map((i) => toItem(i))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))

  // 유물: 공용 풀(TFT_Item_Artifact_*) + 해당 세트 전용(TFT{N}_Item_Artifact_*)
  const artifacts = raw.items
    .filter(
      (i) =>
        !i.isAugment &&
        (/^TFT_Item_Artifact_/.test(i.apiName) || new RegExp(`^${prefix}Item_Artifact_`).test(i.apiName))
    )
    .map((i) => toItem(i, { setExclusive: i.apiName.startsWith(prefix) }))
    .sort((a, b) => Number(a.setExclusive) - Number(b.setExclusive) || a.name.localeCompare(b.name, 'ko'))

  // 상징: 이름에서 "상징"을 떼면 특성 이름이 된다
  const traitNameSet = new Set(traits.map((t) => t.name))
  const emblems = raw.items
    .filter((i) => i.apiName.startsWith(prefix) && /Emblem/i.test(i.apiName) && /상징$/.test(i.name || ''))
    .map((i) => {
      const traitName = i.name.replace(/\s*상징$/, '')
      return toItem(i, {
        traitName: traitNameSet.has(traitName) ? traitName : null,
        craftable: (i.composition || []).length === 2,
      })
    })
    .sort((a, b) => Number(!a.craftable) - Number(!b.craftable) || a.name.localeCompare(b.name, 'ko'))

  // 특성과 연결되지 않는 항목(상점의 "무작위 상징" 등)은 툴에서 쓸 수 없으므로 제외
  const dropped = emblems.filter((e) => !e.traitName)
  if (dropped.length) log('제외한 상징 →', dropped.map((e) => e.name).join(', '))
  const realEmblems = emblems.filter((e) => e.traitName)

  // ---- 이미지 --------------------------------------------------------------
  const allItems = [...components, ...combined, ...artifacts, ...realEmblems]
  const imgJobs = []
  const register = (remote, kind) => {
    if (!remote) return null
    const file = remote.split('/').pop()
    const local = `/img/${kind}/${file}`
    imgJobs.push({ remote, dest: path.join(ROOT, 'public', 'img', kind, file) })
    return local
  }

  for (const dir of ['champion', 'trait', 'item']) {
    await mkdir(path.join(ROOT, 'public', 'img', dir), { recursive: true })
  }

  for (const c of champions) c.icon = register(c.icon, 'champion')
  for (const t of traits) t.icon = register(t.icon, 'trait')
  for (const i of allItems) {
    i.icon = register(i.icon, 'item')
    for (const f of i.from) f.icon = register(f.icon, 'item')
  }

  log(`이미지 ${imgJobs.length}개 확인 중...`)
  const stats = await downloadAll(imgJobs)
  log(`이미지 완료 (새로 받음 ${stats.ok} / 이미 있음 ${stats.skip} / 실패 ${stats.fail})`)

  // ---- 저장 ----------------------------------------------------------------
  const payload = {
    set: SET_NUMBER,
    generatedAt: new Date().toISOString(),
    champions,
    traits,
    items: { components, combined, artifacts, emblems: realEmblems },
  }

  await mkdir(path.join(ROOT, 'public', 'data'), { recursive: true })
  const outFile = path.join(ROOT, 'public', 'data', `set${SET_NUMBER}.json`)
  await writeFile(outFile, JSON.stringify(payload))
  const size = (JSON.stringify(payload).length / 1024).toFixed(0)

  log(`저장 완료: public/data/set${SET_NUMBER}.json (${size}KB)`)
  log(
    `챔피언 ${champions.length} · 특성 ${traits.length} · 조합 ${combined.length} · 유물 ${artifacts.length} · 상징 ${realEmblems.length}`
  )
}

main().catch((err) => {
  console.error('[sync] 실패:', err.message)
  process.exit(1)
})

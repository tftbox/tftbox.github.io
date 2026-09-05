// TFT 데이터 동기화 스크립트
//
//   node scripts/sync-tft-data.mjs          -> 기본 세트(SET_NUMBER) 갱신
//   SET=19 node scripts/sync-tft-data.mjs   -> 다음 시즌으로 전환
//
// Community Dragon의 통합 JSON(약 24MB)을 받아 필요한 부분만 추려
// public/data/set{N}.json 으로 저장하고, 아이콘 이미지를 public/img 아래에 내려받는다.
//
// 주의: 세트마다 게임 내부 이름 규칙이 다르다.
//   시즌 17 -> 챔피언 TFT17_Briar, 아이템은 공용 네임스페이스 TFT_Item_*
//   시즌 18 -> 챔피언 DA_18_Sentry, 아이템은 세트 전용 네임스페이스 DA_*
// 그래서 접두사를 박아 두지 않고 데이터에서 알아내도록 만들었다.

import { mkdir, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SET_NUMBER = Number(process.env.SET || 18)

const SOURCE = 'https://raw.communitydragon.org/latest/cdragon/tft/ko_kr.json'
const GAME_CDN = 'https://raw.communitydragon.org/latest/game/'

// 기본 아이템을 화면에 늘어놓을 순서 (접두사를 뗀 이름 기준)
const COMPONENT_ORDER = [
  'BFSword',
  'RecurveBow',
  'NeedlesslyLargeRod',
  'TearOfTheGoddess',
  'ChainVest',
  'NegatronCloak',
  'GiantsBelt',
  'SparringGloves',
  'Spatula',
  'FryingPan',
]

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

/** apiName의 마지막 구간 (TFT_Item_BFSword / DA_Component_BFSword → BFSword) */
const baseName = (apiName) => apiName.split('_').pop()

/** 이 세트 챔피언들이 공통으로 쓰는 코드 접두사를 알아낸다 (TFT17_ / DA_) */
function detectCodePrefix(champions) {
  const counts = new Map()
  for (const c of champions) {
    const head = c.apiName.split('_')[0]
    counts.set(head, (counts.get(head) || 0) + 1)
  }
  const [head] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  return `${head}_`
}

async function main() {
  const raw = await fetchJson(SOURCE)
  const set = raw.sets[String(SET_NUMBER)]
  if (!set) throw new Error(`세트 ${SET_NUMBER} 데이터를 찾을 수 없습니다.`)

  // ---- 챔피언 --------------------------------------------------------------
  // 세트 목록에는 골렘·훈련봇·모루처럼 모든 세트가 공유하는 유닛도 섞여 있다.
  // 아이콘 경로에 tft{세트번호}가 들어 있는지로 이번 세트 유닛만 골라낸다.
  const iconBelongsToSet = new RegExp(`tft${SET_NUMBER}_`)
  const rawChampions = set.champions.filter(
    (c) => (c.traits || []).length > 0 && iconBelongsToSet.test(c.tileIcon || '')
  )
  if (!rawChampions.length) throw new Error(`세트 ${SET_NUMBER}의 챔피언을 찾지 못했습니다.`)

  const codePrefix = detectCodePrefix(rawChampions)
  log(`세트 ${SET_NUMBER} · 코드 접두사 "${codePrefix}"`)

  const champions = rawChampions
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

  // 기본 아이템. 세트가 자기 네임스페이스를 쓰는지(시즌 18) 공용을 쓰는지(시즌 17)를
  // 여기서 판별하고, 나머지 아이템 분류도 그 판단을 따른다.
  const tagged = raw.items.filter((i) => (i.tags || []).includes('component'))
  const ownComponents = tagged.filter((i) => i.apiName.startsWith(codePrefix))
  const usesOwnNamespace = ownComponents.length >= COMPONENT_ORDER.length
  const rawComponents = usesOwnNamespace ? ownComponents : tagged.filter((i) => /^TFT_Item_/.test(i.apiName))

  const components = rawComponents
    .slice()
    .sort((a, b) => COMPONENT_ORDER.indexOf(baseName(a.apiName)) - COMPONENT_ORDER.indexOf(baseName(b.apiName)))
    .map((i) => toItem(i))

  const componentIds = new Set(rawComponents.map((i) => i.apiName))

  // 조합 아이템: 위에서 정한 기본 아이템 두 개로 만들어지는 것.
  // 상징은 따로 다루고, 찬란한/오염된 변형은 원본과 이름이 겹쳐서 제외한다.
  const rawCombined = raw.items.filter(
    (i) =>
      !i.isAugment &&
      (i.composition || []).length === 2 &&
      i.composition.every((c) => componentIds.has(c)) &&
      !/상징$/.test(i.name || '') &&
      !/Radiant$/i.test(i.apiName) &&
      !/Corrupted/i.test(i.apiName)
  )
  const combined = [...rawCombined].sort((a, b) => a.name.localeCompare(b.name, 'ko')).map((i) => toItem(i))

  // 찬란한 아이템: 조합 아이템 id 뒤에 Radiant가 붙은 것 (없는 세트도 있다).
  // 밑줄을 끼워 넣은 것(DA_SpiritVisage_Radiant)과 붙여 쓴 것(DA_VoidStaffRadiant)이 섞여 있다.
  const combinedIds = new Set(rawCombined.map((i) => i.apiName))
  const radiantBase = (apiName) => apiName.replace(/_?Radiant$/, '')
  const radiant = raw.items
    .filter((i) => !i.isAugment && /_?Radiant$/.test(i.apiName) && combinedIds.has(radiantBase(i.apiName)))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    .map((i) => toItem(i))

  // 유물
  const ownArtifactRe = new RegExp(`^${codePrefix}(Item_)?Artifact_`)
  const artifactSources = usesOwnNamespace
    ? raw.items.filter((i) => !i.isAugment && ownArtifactRe.test(i.apiName))
    : raw.items.filter((i) => !i.isAugment && (/^TFT_Item_Artifact_/.test(i.apiName) || ownArtifactRe.test(i.apiName)))

  const artifacts = artifactSources
    .map((i) =>
      toItem(i, {
        // 공용 풀을 쓰는 세트에서만 "이번 시즌 전용"을 구분할 수 있다
        setExclusive: !usesOwnNamespace && i.apiName.startsWith(codePrefix),
      })
    )
    .sort((a, b) => Number(a.setExclusive) - Number(b.setExclusive) || a.name.localeCompare(b.name, 'ko'))

  // 상징: 이름에서 "상징"을 떼면 특성 이름이 된다.
  // 같은 특성의 상징이 여러 개 있으면(강화판 등) 조합 가능한 쪽을 대표로 남긴다.
  const emblemByTrait = new Map()
  for (const i of raw.items) {
    if (!i.apiName.startsWith(codePrefix) || !/상징$/.test(i.name || '')) continue
    const traitName = i.name.replace(/\s*상징$/, '')
    const craftable = (i.composition || []).length === 2
    const prev = emblemByTrait.get(traitName)
    if (!prev || (craftable && !prev.craftable) || (craftable === prev.craftable && i.apiName.length < prev.item.apiName.length)) {
      emblemByTrait.set(traitName, { item: i, craftable })
    }
  }

  // ---- 특성 ----------------------------------------------------------------
  // 같은 이름의 특성이 여러 개면(예: 시즌 17 별돌보미의 내부 변형들) apiName이 짧은 쪽을 쓴다
  const traitByName = new Map()
  for (const t of set.traits) {
    const prev = traitByName.get(t.name)
    if (!prev || t.apiName.length < prev.apiName.length) traitByName.set(t.name, t)
  }

  // 챔피언이 쓰는 특성 + 상징으로만 붙일 수 있는 특성을 남긴다
  const neededTraits = new Set([...champions.flatMap((c) => c.traits), ...emblemByTrait.keys()])
  const traits = [...traitByName.values()]
    .filter((t) => neededTraits.has(t.name))
    .map((t) => {
      const sorted = (t.effects || []).slice().sort((a, b) => a.minUnits - b.minUnits)
      return {
        id: t.apiName,
        name: t.name,
        icon: iconPath(t.icon),
        desc: cleanTraitDesc(t.desc, sorted),
        effects: sorted.map((e) => ({
          min: e.minUnits,
          max: e.maxUnits >= 25000 ? null : e.maxUnits,
          style: STYLE_MAP[e.style] || 'bronze',
        })),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))

  // 특성과 짝이 맞지 않는 상징(상점의 "무작위 상징" 등)은 툴에서 쓸 수 없으므로 제외
  const traitNameSet = new Set(traits.map((t) => t.name))
  const dropped = []
  const emblems = []
  for (const [traitName, { item, craftable }] of emblemByTrait) {
    if (!traitNameSet.has(traitName)) {
      dropped.push(item.name)
      continue
    }
    emblems.push(toItem(item, { traitName, craftable }))
  }
  emblems.sort((a, b) => Number(!a.craftable) - Number(!b.craftable) || a.name.localeCompare(b.name, 'ko'))
  if (dropped.length) log('특성과 연결되지 않아 제외 →', dropped.join(', '))

  // ---- 이미지 --------------------------------------------------------------
  const allItems = [...components, ...combined, ...radiant, ...artifacts, ...emblems]
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
    items: { components, combined, radiant, artifacts, emblems },
  }

  await mkdir(path.join(ROOT, 'public', 'data'), { recursive: true })
  const outFile = path.join(ROOT, 'public', 'data', `set${SET_NUMBER}.json`)
  const json = JSON.stringify(payload)
  await writeFile(outFile, json)

  log(`저장 완료: public/data/set${SET_NUMBER}.json (${(json.length / 1024).toFixed(0)}KB)`)
  log(
    `챔피언 ${champions.length} · 특성 ${traits.length} · 기본 ${components.length} · 조합 ${combined.length} · ` +
      `찬란한 ${radiant.length} · 유물 ${artifacts.length} · 상징 ${emblems.length}`
  )
}

main().catch((err) => {
  console.error('[sync] 실패:', err.message)
  process.exit(1)
})

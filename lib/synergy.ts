import type { Champion, Item, PlacedUnit, SetData, Trait, TraitBreakpoint, TraitStyle } from './types'

/** 계산 편의를 위해 데이터를 id/이름으로 찾을 수 있게 묶어둔 것 */
export interface SetIndex {
  data: SetData
  championById: Map<string, Champion>
  traitByName: Map<string, Trait>
  itemById: Map<string, Item>
  /** 상징 id → 부여하는 특성 이름 */
  emblemTrait: Map<string, string>
}

export function buildIndex(data: SetData): SetIndex {
  const itemById = new Map<string, Item>()
  const allItems = [...data.items.components, ...data.items.combined, ...data.items.artifacts, ...data.items.emblems]
  for (const i of allItems) itemById.set(i.id, i)

  const emblemTrait = new Map<string, string>()
  for (const e of data.items.emblems) if (e.traitName) emblemTrait.set(e.id, e.traitName)

  return {
    data,
    championById: new Map(data.champions.map((c) => [c.id, c])),
    traitByName: new Map(data.traits.map((t) => [t.name, t])),
    itemById,
    emblemTrait,
  }
}

export interface ActiveTrait {
  trait: Trait
  /** 특성을 만족시키는 유닛 수 (상징 포함) */
  count: number
  /** 현재 활성화된 단계. 아직 활성이 아니면 null */
  current: TraitBreakpoint | null
  /** 다음 단계. 최종 단계면 null */
  next: TraitBreakpoint | null
  style: TraitStyle
}

/**
 * 배치된 유닛으로 특성 활성화 상태를 계산한다.
 *
 * - 같은 챔피언을 두 번 놓아도 특성은 한 번만 센다 (게임과 동일)
 * - 상징 아이템은 장착한 유닛에게 해당 특성을 하나 더 붙여준다.
 *   단, 그 유닛이 이미 가진 특성이면 중복으로 세지 않는다.
 */
export function computeTraits(units: PlacedUnit[], index: SetIndex): ActiveTrait[] {
  // 특성 이름 → 그 특성을 가진 서로 다른 챔피언 id 집합
  const contributors = new Map<string, Set<string>>()

  const add = (traitName: string, championId: string) => {
    let set = contributors.get(traitName)
    if (!set) contributors.set(traitName, (set = new Set()))
    set.add(championId)
  }

  for (const unit of units) {
    const champ = index.championById.get(unit.id)
    if (!champ) continue

    const traits = new Set(champ.traits)
    for (const itemId of unit.items) {
      const granted = index.emblemTrait.get(itemId)
      if (granted) traits.add(granted)
    }
    for (const name of traits) add(name, champ.id)
  }

  const result: ActiveTrait[] = []
  for (const [name, champs] of contributors) {
    const trait = index.traitByName.get(name)
    if (!trait) continue
    const count = champs.size

    let current: TraitBreakpoint | null = null
    let next: TraitBreakpoint | null = null
    for (const eff of trait.effects) {
      if (count >= eff.min) current = eff
      else if (!next) next = eff
    }

    result.push({ trait, count, current, next, style: current?.style ?? 'none' })
  }

  return result.sort(compareTraits)
}

const STYLE_RANK: Record<TraitStyle, number> = {
  prismatic: 5,
  gold: 4,
  unique: 3,
  silver: 2,
  bronze: 1,
  none: 0,
}

/** 활성 단계가 높은 순 → 유닛 수 많은 순 → 이름순 */
function compareTraits(a: ActiveTrait, b: ActiveTrait) {
  const rank = STYLE_RANK[b.style] - STYLE_RANK[a.style]
  if (rank !== 0) return rank
  if (b.count !== a.count) return b.count - a.count
  return a.trait.name.localeCompare(b.trait.name, 'ko')
}

/** 배치된 유닛의 총 비용 (성급 반영: 2성 3배, 3성 9배) */
export function deckCost(units: PlacedUnit[], index: SetIndex): number {
  return units.reduce((sum, u) => {
    const champ = index.championById.get(u.id)
    if (!champ) return sum
    const multiplier = u.star >= 3 ? 9 : u.star === 2 ? 3 : 1
    return sum + champ.cost * multiplier
  }, 0)
}

/** 코스트별 테두리 색 */
export const COST_COLOR: Record<number, string> = {
  1: '#6b7280',
  2: '#16a34a',
  3: '#2563eb',
  4: '#a855f7',
  5: '#f59e0b',
}

/** 특성 단계별 배지 색 */
export const STYLE_COLOR: Record<TraitStyle, { bg: string; text: string; ring: string }> = {
  none: { bg: '#1f2937', text: '#6b7280', ring: '#374151' },
  bronze: { bg: '#3d2b1b', text: '#c8834a', ring: '#7c5230' },
  silver: { bg: '#2b3138', text: '#c3ced9', ring: '#7b8794' },
  gold: { bg: '#3d3315', text: '#f0c040', ring: '#a4832a' },
  unique: { bg: '#0f3b34', text: '#4ade80', ring: '#1f7a63' },
  prismatic: { bg: '#33234a', text: '#e0aaff', ring: '#8b5cf6' },
}

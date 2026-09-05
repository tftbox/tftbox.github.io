// 동기화 스크립트가 만들어내는 데이터의 형태 (public/data/set{N}.json)

export type ItemKind = 'component' | 'combined' | 'artifact' | 'emblem'

export interface ItemSource {
  id: string
  name: string
  icon: string | null
}

export interface Item {
  id: string
  name: string
  icon: string | null
  desc: string
  from: ItemSource[]
  unique: boolean
  /** 유물에만 존재. 이번 시즌 전용 유물인지 */
  setExclusive?: boolean
  /** 상징에만 존재 */
  traitName?: string
  craftable?: boolean
}

export interface Champion {
  id: string
  name: string
  cost: number
  traits: string[]
  icon: string | null
  ability: { name: string; desc: string } | null
  stats: {
    hp: number
    damage: number
    armor: number
    mr: number
    attackSpeed: number
    range: number
    mana: number
    initialMana: number
  } | null
}

export type TraitStyle = 'none' | 'bronze' | 'silver' | 'gold' | 'unique' | 'prismatic'

export interface TraitBreakpoint {
  min: number
  max: number | null
  style: TraitStyle
}

export interface Trait {
  id: string
  name: string
  icon: string | null
  desc: string
  effects: TraitBreakpoint[]
}

export interface SetData {
  set: number
  generatedAt: string
  champions: Champion[]
  traits: Trait[]
  items: {
    components: Item[]
    combined: Item[]
    artifacts: Item[]
    emblems: Item[]
  }
}

// ---- 덱 -------------------------------------------------------------------

/** 배치판 위의 유닛 하나 */
export interface PlacedUnit {
  /** 챔피언 id (예: TFT17_Briar) */
  id: string
  /** 0=맨 앞줄, 3=맨 뒷줄 */
  row: number
  /** 0~6 */
  col: number
  /** 1~3성 */
  star: number
  /** 장착 아이템 id (최대 3개) */
  items: string[]
}

export interface Deck {
  id: string
  setNumber: number
  name: string
  tags: string[]
  units: PlacedUnit[]
  memo: string
  createdAt: string
  updatedAt: string
}

/** 즐겨찾기 / 메모를 붙일 수 있는 대상 */
export type NoteKind = 'artifact' | 'emblem'

export interface Note {
  kind: NoteKind
  refId: string
  favorite: boolean
  memo: string
}

export const BOARD_ROWS = 4
export const BOARD_COLS = 7

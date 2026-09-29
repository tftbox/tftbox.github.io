/** 순위표(아이템 · 유물)에서 같이 쓰는 등급 타입과 색 */
export type Tier = 'S' | 'A' | 'B' | 'C' | 'D'

export interface TierRow {
  tier: Tier
  /** 아이템/유물 id 순서대로 */
  itemIds: string[]
}

export const TIER_COLOR: Record<Tier, { bg: string; text: string }> = {
  S: { bg: '#c9828a', text: '#3a1b20' },
  A: { bg: '#cf9f78', text: '#3b2412' },
  B: { bg: '#c9b57c', text: '#382d10' },
  C: { bg: '#b3b98a', text: '#2c2f12' },
  D: { bg: '#93b58a', text: '#1b2d16' },
}

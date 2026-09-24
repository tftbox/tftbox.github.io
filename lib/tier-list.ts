/** 순위표(아이템 · 유물)에서 같이 쓰는 등급 타입과 색 */
export type Tier = 'S' | 'A' | 'B' | 'C' | 'D'

export interface TierRow {
  tier: Tier
  /** 아이템/유물 id 순서대로 */
  itemIds: string[]
}

export const TIER_COLOR: Record<Tier, { bg: string; text: string }> = {
  S: { bg: '#e0596b', text: '#2a0d12' },
  A: { bg: '#e2924e', text: '#2e1a08' },
  B: { bg: '#d9bd5a', text: '#2e2508' },
  C: { bg: '#cbd66c', text: '#232608' },
  D: { bg: '#7fc86a', text: '#10260a' },
}

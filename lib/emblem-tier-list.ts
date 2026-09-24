import type { TierRow } from './tier-list'

/**
 * 상징 순위. 아이템 · 유물 순위와 마찬가지로 직접 정해서 넣어 둔 고정 목록이다
 * (패치가 바뀌면 이 파일을 손으로 고쳐야 한다).
 */
export const EMBLEM_TIER_LIST: TierRow[] = [
  {
    tier: 'S',
    itemIds: [
      'DA_18_EmblemExecutioner',
      'DA_18_EmblemInvoker',
      'DA_18_EmblemElderwood',
      'DA_18_EmblemCoven',
      'DA_18_EmblemJuggernaut',
      'DA_18_EmblemInferno',
    ],
  },
  {
    tier: 'A',
    itemIds: ['DA_18_EmblemHunter', 'DA_18_EmblemBrawler', 'DA_18_EmblemSlayer', 'DA_18_EmblemFloraFatalis'],
  },
  {
    tier: 'B',
    itemIds: [
      'DA_18_EmblemSpellweaver',
      'DA_18_EmblemRapidfire',
      'DA_18_EmblemFae',
      'DA_18_EmblemBlossom',
      'DA_18_EmblemDefender',
    ],
  },
  {
    tier: 'C',
    itemIds: ['DA_18_EmblemVanguard', 'DA_18_EmblemBlackthorn', 'DA_18_EmblemPrimal', 'DA_18_EmblemLunar'],
  },
  {
    tier: 'D',
    itemIds: ['DA_18_EmblemSprykin'],
  },
]

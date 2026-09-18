/**
 * 아이템 순위. 통계 사이트에서 자동으로 받아오는 게 아니라, 직접 정해서 넣어 둔
 * 고정 목록이다 (패치가 바뀌면 이 파일을 손으로 고쳐야 한다).
 */
export type ItemTier = 'S' | 'A' | 'B' | 'C'

export interface ItemTierRow {
  tier: ItemTier
  /** 아이템 id (set{N}.json의 완성/찬란한 아이템 id) 순서대로 */
  itemIds: string[]
}

export const ITEM_TIER_LIST: ItemTierRow[] = [
  {
    tier: 'S',
    itemIds: [
      'DA_Deathblade',
      'DA_GargoyleStoneplate',
      'DA_WarmogsArmor',
      'DA_Morellonomicon',
      'DA_GuinsoosRageblade',
      'DA_RedBuff',
      'DA_JeweledGauntlet',
      'DA_SpearOfShojin',
    ],
  },
  {
    tier: 'A',
    itemIds: [
      'DA_EdgeOfNight',
      'DA_ProtectorsVow',
      'DA_StrikersFlail',
      'DA_Crownguard',
      'DA_LastWhisper',
      'DA_ThiefsGloves',
      'DA_AdaptiveHelm',
    ],
  },
  {
    tier: 'B',
    itemIds: [
      'DA_SteraksGage',
      'DA_HextechGunblade',
      'DA_InfinityEdge',
      'DA_SpiritVisage',
      'DA_RabadonsDeathcap',
      'DA_GiantSlayer',
      'DA_TitansResolve',
      'DA_KrakensFury',
      'DA_VoidStaff',
      'DA_BlueBuff',
    ],
  },
  {
    tier: 'C',
    itemIds: [
      'DA_Bloodthirster',
      'DA_BrambleVest',
      'DA_SunfireCape',
      'DA_SteadfastHeart',
      'DA_IonicSpark',
      'DA_ArchangelsStaff',
      'DA_Evenshroud',
      'DA_DragonsClaw',
      'DA_Quicksilver',
      'DA_NashorsTooth',
      'DA_HandOfJustice',
    ],
  },
]

export const ITEM_TIER_COLOR: Record<ItemTier, { bg: string; text: string }> = {
  S: { bg: '#e0596b', text: '#2a0d12' },
  A: { bg: '#e2924e', text: '#2e1a08' },
  B: { bg: '#d9bd5a', text: '#2e2508' },
  C: { bg: '#cbd66c', text: '#232608' },
}

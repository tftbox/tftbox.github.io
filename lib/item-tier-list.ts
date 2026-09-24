import type { TierRow } from './tier-list'

/**
 * 아이템 순위. 통계 사이트에서 자동으로 받아오는 게 아니라, 직접 정해서 넣어 둔
 * 고정 목록이다 (패치가 바뀌면 이 파일을 손으로 고쳐야 한다).
 */
export const ITEM_TIER_LIST: TierRow[] = [
  {
    tier: 'S',
    itemIds: [
      'DA_EdgeOfNight',
      'DA_SteraksGage',
      'DA_InfinityEdge',
      'DA_BrambleVest',
      'DA_GargoyleStoneplate',
      'DA_WarmogsArmor',
      'DA_Crownguard',
      'DA_ArchangelsStaff',
      'DA_GuinsoosRageblade',
      'DA_RedBuff',
      'DA_VoidStaff',
      'DA_SpearOfShojin',
      'DA_AdaptiveHelm',
      'DA_BlueBuff',
    ],
  },
  {
    tier: 'A',
    itemIds: ['DA_Deathblade', 'DA_ProtectorsVow', 'DA_Morellonomicon', 'DA_RabadonsDeathcap', 'DA_GiantSlayer'],
  },
  {
    tier: 'B',
    itemIds: [
      'DA_HextechGunblade',
      'DA_SteadfastHeart',
      'DA_StrikersFlail',
      'DA_SpiritVisage',
      'DA_IonicSpark',
      'DA_KrakensFury',
      'DA_LastWhisper',
      'DA_JeweledGauntlet',
      'DA_HandOfJustice',
    ],
  },
  {
    tier: 'C',
    itemIds: ['DA_Bloodthirster', 'DA_Evenshroud', 'DA_Quicksilver', 'DA_TitansResolve', 'DA_ThiefsGloves'],
  },
  {
    tier: 'D',
    itemIds: ['DA_SunfireCape', 'DA_DragonsClaw', 'DA_NashorsTooth'],
  },
]

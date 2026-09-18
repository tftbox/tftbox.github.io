import type { TierRow } from './tier-list'

/**
 * 유물 순위. 아이템 순위와 마찬가지로 직접 정해서 넣어 둔 고정 목록이다
 * (패치가 바뀌면 이 파일을 손으로 고쳐야 한다).
 */
export const ARTIFACT_TIER_LIST: TierRow[] = [
  {
    tier: 'S',
    itemIds: ['DA_Artifact_SilvermereDawn', 'DA_Artifact_WitsEnd', 'DA_Artifact_Dawncore'],
  },
  {
    tier: 'A',
    itemIds: [
      'DA_Artifact_LightshieldCrest',
      'DA_Artifact_TitanicHydra',
      'DA_Artifact_RapidFireCannon',
      'DA_Artifact_LudensTempest',
      'DA_Artifact_LichBane',
      'DA_Artifact_NavoriFlickerblade',
      'DA_Artifact_Fishbones',
      'DA_Artifact_BlightingJewel',
      'DA_Artifact_EternalPact',
      'DA_Artifact_HellfireHatchet',
      'DA_Artifact_HorizonFocus',
      'DA_Artifact_GoldCollector',
    ],
  },
  {
    tier: 'B',
    itemIds: [
      'DA_Artifact_VoidGauntlet',
      'DA_Artifact_Manazane',
      'DA_Artifact_InfinityForce',
      'DA_Item_Artifact_TalismanOfAscension',
      'DA_Artifact_ZhonyasParadox',
      'DA_Artifact_SeekersArmguard',
    ],
  },
  {
    tier: 'C',
    itemIds: [
      'DA_Artifact_MogulsMail',
      'DA_Artifact_ForbiddenIdol',
      'DA_Artifact_GamblersBlade',
      'DA_Artifact_Mittens',
      'DA_Artifact_TheIndomitable',
      'DA_Artifact_AegisOfDawn',
      'DA_Artifact_StatikkShiv',
      'DA_Artifact_AegisOfDusk',
    ],
  },
]

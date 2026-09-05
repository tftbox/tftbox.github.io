import type { SetData } from '@/lib/types'

/** 아이템을 고를 때 보여줄 분류와 순서. 유닛 시트와 아이템 목록이 함께 쓴다. */
export const ITEM_TABS = [
  { key: 'combined', label: '조합' },
  { key: 'radiant', label: '찬란한' },
  { key: 'artifacts', label: '유물' },
  { key: 'emblems', label: '상징' },
  { key: 'components', label: '기본' },
] as const satisfies { key: keyof SetData['items']; label: string }[]

export type ItemTabKey = (typeof ITEM_TABS)[number]['key']

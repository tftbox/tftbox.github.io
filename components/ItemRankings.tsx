import type { SetData } from '@/lib/types'
import { ITEM_TIER_LIST } from '@/lib/item-tier-list'
import TierList from './TierList'

export default function ItemRankings({ data }: { data: SetData }) {
  return <TierList pool={[...data.items.combined, ...data.items.radiant]} tierList={ITEM_TIER_LIST} />
}

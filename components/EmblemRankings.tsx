import type { SetData } from '@/lib/types'
import { EMBLEM_TIER_LIST } from '@/lib/emblem-tier-list'
import TierList from './TierList'

export default function EmblemRankings({ data }: { data: SetData }) {
  return <TierList pool={data.items.emblems} tierList={EMBLEM_TIER_LIST} />
}

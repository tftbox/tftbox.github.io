import type { SetData } from '@/lib/types'
import { ARTIFACT_TIER_LIST } from '@/lib/artifact-tier-list'
import TierList from './TierList'

export default function ArtifactRankings({ data }: { data: SetData }) {
  return <TierList pool={data.items.artifacts} tierList={ARTIFACT_TIER_LIST} />
}

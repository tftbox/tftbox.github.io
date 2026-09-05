import ArtifactBrowser from '@/components/ArtifactBrowser'
import { getSetData } from '@/lib/set-data'

export const metadata = { title: '유물 · TFT 툴' }

export default async function ArtifactsPage() {
  const data = await getSetData()
  return <ArtifactBrowser artifacts={data.items.artifacts} setNumber={data.set} />
}

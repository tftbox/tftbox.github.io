import EmblemBrowser from '@/components/EmblemBrowser'
import { getSetData } from '@/lib/set-data'

export const metadata = { title: '상징 · TFT 툴' }

export default async function EmblemsPage() {
  const data = await getSetData()
  return <EmblemBrowser emblems={data.items.emblems} traits={data.traits} setNumber={data.set} />
}

import EmblemBrowser from '@/components/EmblemBrowser'
import { getSetData } from '@/lib/set-data'

export const metadata = { title: '상징 · 밤돌지지 - 얘들아 롤체하자' }

export default async function EmblemsPage() {
  const data = await getSetData()
  return <EmblemBrowser emblems={data.items.emblems} traits={data.traits} setNumber={data.set} />
}

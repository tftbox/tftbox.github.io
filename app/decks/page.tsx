import DeckTabs from '@/components/DeckTabs'
import { getSetData } from '@/lib/set-data'

export const metadata = { title: '내 덱 · 밤돌지지 - 얘들아 롤체하자' }

export default async function DecksPage() {
  const data = await getSetData()
  return <DeckTabs data={data} />
}

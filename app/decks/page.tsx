import DeckLibrary from '@/components/DeckLibrary'
import { getSetData } from '@/lib/set-data'

export const metadata = { title: '내 덱 · TFT 툴' }

export default async function DecksPage() {
  const data = await getSetData()
  return <DeckLibrary data={data} />
}

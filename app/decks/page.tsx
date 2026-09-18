import { Suspense } from 'react'
import DeckTabs from '@/components/DeckTabs'
import { getSetData } from '@/lib/set-data'

export const metadata = { title: '내 덱 · 밤돌지지 - 얘들아 롤체하자' }

export default async function DecksPage() {
  const data = await getSetData()
  return (
    <Suspense fallback={<p className="py-20 text-center text-sm text-ink-400">불러오는 중...</p>}>
      <DeckTabs data={data} />
    </Suspense>
  )
}

import { Suspense } from 'react'
import BoardTool from '@/components/board/BoardTool'
import { getSetData } from '@/lib/set-data'

export default async function BoardPage() {
  const data = await getSetData()

  return (
    <Suspense fallback={<p className="py-20 text-center text-sm text-ink-400">불러오는 중...</p>}>
      <BoardTool data={data} />
    </Suspense>
  )
}

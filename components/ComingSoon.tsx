/** 아직 내용이 없는 탭(아이템 순위 · 증강체 순위)에 쓰는 자리표시자 */
export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-900 p-12 text-center">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-ink-400">준비 중입니다.</p>
    </div>
  )
}

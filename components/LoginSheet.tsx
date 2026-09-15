'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import Sheet from './Sheet'

export default function LoginSheet({ onClose }: { onClose: () => void }) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signIn(email.trim(), password)
    setLoading(false)
    if (error) setError(error)
    else onClose()
  }

  return (
    <Sheet onClose={onClose}>
      <form onSubmit={submit} className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">로그인</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded p-1 text-ink-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-3 text-[11px] text-ink-400">
          저장 · 수정 · 삭제는 로그인했을 때만 할 수 있습니다. 그냥 보기만 할 거면 로그인하지 않아도 됩니다.
        </p>

        <div className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            autoComplete="username"
            required
            className="w-full rounded-lg bg-ink-850 px-3 py-2 text-sm text-white placeholder:text-ink-400"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            autoComplete="current-password"
            required
            className="w-full rounded-lg bg-ink-850 px-3 py-2 text-sm text-white placeholder:text-ink-400"
          />
        </div>

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-3 w-full rounded-lg bg-accent py-2 text-sm font-semibold text-ink-950 transition-opacity disabled:opacity-50"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </Sheet>
  )
}

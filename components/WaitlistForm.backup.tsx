'use client'

import { useState } from 'react'

export default function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setState('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setState('done')
      } else {
        setState('error')
      }
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="text-sm text-[#DFA832]">
        You&apos;re on the list. We&apos;ll map your path when it&apos;s ready.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-0">
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Your email address"
        className="
          flex-1 min-w-0 px-4 py-3 bg-transparent
          border border-white/10 text-[#EAE5D8] text-sm
          placeholder:text-[#4E6898] outline-none
          focus:border-white/25 transition-colors
        "
      />
      <button
        type="submit"
        disabled={state === 'loading'}
        className="
          px-5 py-3 bg-[#DFA832] text-[#06091A] text-sm font-semibold
          uppercase tracking-widest whitespace-nowrap
          hover:bg-[#f0b83a] transition-colors
          disabled:opacity-60
        "
      >
        {state === 'loading' ? '...' : 'Join Waitlist'}
      </button>
      {state === 'error' && (
        <p className="absolute mt-12 text-xs text-red-400">Something went wrong. Try again.</p>
      )}
    </form>
  )
}

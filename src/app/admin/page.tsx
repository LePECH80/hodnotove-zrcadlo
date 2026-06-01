'use client'

import { useState } from 'react'

type State = 'idle' | 'loading' | 'success' | 'error'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<{ accessUrl?: string; emailSent?: boolean; warning?: string; error?: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('loading')
    setResult(null)

    try {
      const res = await fetch('/api/admin-generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPassword: password,
          clientName,
          clientEmail,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setState('success')
        setResult(data)
        setClientName('')
        setClientEmail('')
      } else {
        setState('error')
        setResult(data)
      }
    } catch {
      setState('error')
      setResult({ error: 'Nepodařilo se připojit k serveru' })
    }
  }

  const canSubmit = password.trim() && clientName.trim() && clientEmail.includes('@')

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-14">
      <div className="max-w-lg w-full space-y-6">

        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold tracking-widest text-secondary uppercase mb-2">
            inspiraise · admin
          </p>
          <h1 className="text-2xl font-black text-primary">Odeslat přístup klientce</h1>
          <p className="text-primary/60 text-sm mt-2">
            Vygeneruje unikátní odkaz a odešle ho emailem.
          </p>
        </div>

        {/* Formulář */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">
                Admin heslo
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-peach border border-pink-light rounded-xl px-4 py-3 text-sm text-primary focus:outline-none focus:border-secondary transition-colors"
                required
              />
            </div>

            <hr className="border-pink-light" />

            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">
                Jméno klientky / klienta
              </label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Jana Nováková"
                className="w-full bg-peach border border-pink-light rounded-xl px-4 py-3 text-sm text-primary placeholder:text-primary/40 focus:outline-none focus:border-secondary transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">
                Email klientky / klienta
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                placeholder="jana@email.cz"
                className="w-full bg-peach border border-pink-light rounded-xl px-4 py-3 text-sm text-primary placeholder:text-primary/40 focus:outline-none focus:border-secondary transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit || state === 'loading'}
              className="btn-primary w-full text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {state === 'loading' ? 'Odesílám…' : 'Odeslat přístup →'}
            </button>
          </form>
        </div>

        {/* Výsledek — úspěch */}
        {state === 'success' && result && (
          <div className="card p-6 border-l-4 border-green-500">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div className="flex-1">
                <p className="font-semibold text-primary mb-1">
                  {result.emailSent ? 'Email odeslán!' : 'Token vygenerován'}
                </p>
                {result.emailSent ? (
                  <p className="text-sm text-primary/70">
                    Klientce přišel email s odkazem na diagnostiku.
                  </p>
                ) : (
                  <p className="text-sm text-orange-600">{result.warning}</p>
                )}
                {result.accessUrl && (
                  <div className="mt-3">
                    <p className="text-xs text-primary/50 mb-1">Odkaz pro zálohu:</p>
                    <div className="bg-peach rounded-lg p-3 text-xs font-mono text-primary break-all select-all">
                      {result.accessUrl}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Výsledek — chyba */}
        {state === 'error' && result && (
          <div className="card p-6 border-l-4 border-red-400">
            <div className="flex items-start gap-3">
              <span className="text-2xl">❌</span>
              <div>
                <p className="font-semibold text-primary mb-1">Nepodařilo se odeslat</p>
                <p className="text-sm text-primary/70">{result.error}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

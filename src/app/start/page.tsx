'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

type Status = 'loading' | 'valid' | 'invalid'

const PHASES = [
  {
    num: 1,
    name: 'Stopy',
    desc: 'Vytáhneme konkrétní situace, ve kterých jsi přirozeně pomohla, věci zjednodušila nebo věděla, co ostatní ne.',
  },
  {
    num: 2,
    name: 'Souvislosti',
    desc: 'Budeme hledat, co se v tvých příbězích opakuje a kde se objevují stejné vzorce.',
  },
  {
    num: 3,
    name: 'Slepá místa',
    desc: 'Podíváme se na oblasti, které možná podceňuješ, přehlížíš nebo považuješ za samozřejmé.',
  },
  {
    num: 4,
    name: 'Zóna hodnoty',
    desc: 'Odhalíme, kde vytváříš největší hodnotu a co tě přirozeně odlišuje od ostatních.',
  },
  {
    num: 5,
    name: 'Další směr',
    desc: 'Přeložíme, co jsme spolu odhalily, do prvního konkrétního směru — ať už jde o nabídku, práci nebo osobní rozvoj.',
  },
]

function StartContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<Status>('loading')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }

    fetch('/api/verify-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setSessionId(data.sessionId)
          if (data.email) setEmail(data.email)
          setStatus('valid')
        } else {
          setStatus('invalid')
        }
      })
      .catch(() => setStatus('invalid'))
  }, [token])

  const handleStart = async () => {
    if (!sessionId || !token || !name.trim() || !email.trim()) return
    setStarting(true)

    try {
      await fetch('/api/save-client-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, name: name.trim(), email: email.trim() }),
      })
    } catch {
      // non-blocking — pokračujeme i bez uložení
    }

    sessionStorage.setItem('sessionId', sessionId)
    sessionStorage.setItem('token', token)
    router.push('/chat')
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-10 h-10 rounded-full border-3 border-pink-light border-t-secondary animate-spin" />
        <p className="text-primary/60 text-sm">Ověřuji přístup…</p>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="card max-w-md w-full p-10 text-center">
          <div className="text-5xl mb-6">🔒</div>
          <h1 className="text-2xl font-bold text-primary mb-3">Odkaz není platný</h1>
          <p className="text-primary/70 leading-relaxed">
            Tento odkaz není platný nebo již byl použit. Každý odkaz slouží pro jedno sezení.
            Zkontroluj prosím email — odkaz sis mohla nechat zaslat znovu.
          </p>
        </div>
      </div>
    )
  }

  const canStart = name.trim().length > 0 && email.trim().includes('@')

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-14">
      <div className="max-w-2xl w-full space-y-6">

        {/* Brand + nový název */}
        <div className="text-center">
          <p className="text-sm font-semibold tracking-widest text-secondary uppercase mb-3">
            inspiraise
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-primary leading-tight">
            Tohle přece umí každý!
            <br />
            <span className="text-secondary">…Opravdu?</span>
          </h1>
          <p className="text-primary/70 text-base leading-relaxed mt-4 max-w-lg mx-auto">
            To, co považuješ za samozřejmost, bývá často to nejhodnotnější, co můžeš nabídnout.
          </p>
        </div>

        {/* Uvítací karta + fáze */}
        <div className="card p-8 md:p-10">
          <h2 className="text-lg font-bold text-primary mb-4">
            Ještě než se do toho pustíme ✨
          </h2>
          <div className="space-y-3 text-primary/80 leading-relaxed text-sm md:text-base">
            <p>
              Před tebou je <strong className="text-primary">45–60 minut objevování</strong> toho,
              co už možná dávno umíš, ale přestala jsi to vnímat jako něco výjimečného.
            </p>
            <p>
              Společně projdeme pět oblastí, které nám pomohou odhalit opakující se vzorce,
              přirozené silné stránky i místa, kde svou hodnotu možná zbytečně přehlížíš.
            </p>
            <p>
              Na konci získáš <strong className="text-primary">Osobní mapu hodnoty</strong>, která
              shrne tvé silné stránky, opakující se vzorce, slepá místa i oblasti, na kterých
              můžeš stavět svůj další profesní nebo podnikatelský růst.
            </p>
            <p>
              Odpovídej co nejupřímněji a nejkonkrétněji. Čím více skutečných situací a příkladů
              nabídneš, tím přesnější bude výsledek.
            </p>
          </div>

          {/* Přehled fází */}
          <div className="mt-7 space-y-3">
            {PHASES.map(p => (
              <div key={p.num} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-pink-light flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 mt-0.5">
                  {p.num}
                </div>
                <div>
                  <span className="font-semibold text-primary text-sm">{p.name}</span>
                  <p className="text-xs text-primary/60 leading-snug mt-0.5">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulář — jméno + email */}
        <div className="card p-8 md:p-10">
          <h3 className="text-base font-bold text-primary mb-5">Než začneme, řekni mi o sobě</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Jméno</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jak ti mám říkat?"
                className="w-full bg-peach border border-pink-light rounded-xl px-4 py-3 text-sm text-primary placeholder:text-primary/40 focus:outline-none focus:border-secondary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tvuj@email.cz"
                className="w-full bg-peach border border-pink-light rounded-xl px-4 py-3 text-sm text-primary placeholder:text-primary/40 focus:outline-none focus:border-secondary transition-colors"
              />
              <p className="text-xs text-primary/50 mt-1.5">
                Na tento email ti pošleme kopii reportu po dokončení diagnostiky.
              </p>
            </div>
          </div>
        </div>

        {/* Wispr Flow tip */}
        <div className="card-pink p-7 md:p-8">
          <p className="font-bold text-primary mb-3">💡 Mám pro tebe jeden tip.</p>
          <div className="space-y-3 text-sm text-primary/80 leading-relaxed">
            <p>
              Z vlastních zkušeností jsem si všimla, že mnohem zajímavější odpovědi vznikají
              ve chvíli, kdy lidé <strong className="text-primary">mluví, místo aby psali</strong>.
            </p>
            <p>
              Když píšeme, máme tendenci odpovědi upravovat, zkracovat a hledat správná slova.
              Když mluvíme, myšlenky plynou přirozeněji a často se objeví souvislosti, které by nás
              při psaní vůbec nenapadly.
            </p>
            <p>
              Není to nutnost. Diagnostikou můžeš projít úplně stejně i psaním. Pokud se ti ale
              lépe přemýšlí nahlas, doporučuji zkusit odpovídat hlasem.
            </p>
            <p>
              Já osobně používám aplikaci{' '}
              <strong className="text-primary">Wispr Flow</strong>, která převádí hlas do textu
              a jako jedna z mála nepíše hlouposti.
            </p>
            <div className="pt-1">
              <a
                href="https://wisprflow.ai/r?LENKA74"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-semibold text-secondary hover:text-primary transition-colors"
              >
                👉 Vyzkoušet Wispr Flow zdarma
              </a>
              <p className="text-xs text-primary/50 mt-1">
                Získáš 1 měsíc plné verze zdarma přes můj odkaz.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pb-4">
          <button
            onClick={handleStart}
            disabled={starting || !canStart}
            className="btn-primary text-lg px-10 py-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {starting ? 'Připravuji…' : 'Jdeme na to →'}
          </button>
          {!canStart && (
            <p className="text-xs text-primary/50 mt-3">
              Vyplň prosím jméno a email pro pokračování.
            </p>
          )}
          <p className="text-xs text-primary/40 mt-4">
            Sezení se automaticky ukládá — můžeš se vrátit, pokud prohlížeč zavřeš.
          </p>
        </div>

      </div>
    </div>
  )
}

export default function StartPage() {
  return (
    <Suspense>
      <StartContent />
    </Suspense>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Strength {
  title: string
  description: string
  evidence: string[]
  whyItMatters: string
  score: number
}

interface OfferDirection {
  name: string
  forWhom: string
  inSituation: string
  whatTheyGet: string
  whyItFits: string
  watchOut: string
}

interface Tension {
  title: string
  sideA: string
  sideB: string
  meaning: string
  question: string
}

interface ReportData {
  heroInsight: string
  clientSummary: string
  shortMirror: string
  coreStrengths: Strength[]
  energyMap: { drains: string[]; energizes: string[] }
  blindSpots: { selfStatement: string; truth: string }[]
  patterns: { name: string; description: string }[]
  valueZone: { archetype: string; description: string; evidence: string }[]
  keepDelegate: { keep: string[]; delegate: string[] }
  offerDirections: OfferDirection[]
  positioningPhrases: string[]
  tensions: Tension[]
  nextSteps: string[]
  closingMirror: string
}

interface SavedThought {
  messageIndex: number
  content: string
  role: 'user' | 'assistant'
}

// --- Animované tečky v textu ---
function AnimatedDots() {
  const [count, setCount] = useState(1)
  useEffect(() => {
    const id = setInterval(() => setCount(c => (c % 3) + 1), 600)
    return () => clearInterval(id)
  }, [])
  return <span>{'.'.repeat(count)}</span>
}

// --- Animace konstelace (plynulá smyčka) ---
function ConstellationLoader() {
  const dots = [
    { x: 30,  y: 92  },
    { x: 82,  y: 28  },
    { x: 155, y: 18  },
    { x: 212, y: 58  },
    { x: 228, y: 115 },
    { x: 158, y: 145 },
    { x: 68,  y: 132 },
  ]

  const lines: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [4, 5], [5, 6], [6, 0],
    [1, 5], [2, 6],
  ]

  return (
    <svg width="480" height="304" viewBox="0 0 260 165" aria-hidden="true">
      {lines.map(([a, b], i) => {
        const dx = dots[b].x - dots[a].x
        const dy = dots[b].y - dots[a].y
        const len = Math.round(Math.sqrt(dx * dx + dy * dy))
        return (
          <line
            key={`l${i}`}
            x1={dots[a].x} y1={dots[a].y}
            x2={dots[b].x} y2={dots[b].y}
            stroke="var(--color-secondary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={len}
            strokeDashoffset={len}
            style={{
              opacity: 0.35,
              animation: `constellation-line-in 1.2s ease-in-out ${0.2 + i * 0.15}s infinite alternate`,
            }}
          />
        )
      })}
      {dots.map((d, i) => (
        <circle
          key={`d${i}`}
          cx={d.x}
          cy={d.y}
          r={i === 0 ? 6 : 4}
          fill={i === 0 ? 'var(--color-orange)' : 'var(--color-secondary)'}
          style={{
            opacity: 0,
            animation: `constellation-dot-in 0.5s ease-in-out ${i * 0.1}s infinite alternate`,
          }}
        />
      ))}
    </svg>
  )
}

export default function ReportPage() {
  const router = useRouter()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistSent, setWaitlistSent] = useState(false)
  const [ahaThoughts, setAhaThoughts] = useState<SavedThought[]>([])

  useEffect(() => {
    // Načti uložené myšlenky
    const saved = sessionStorage.getItem('savedThoughts')
    if (saved) {
      try { setAhaThoughts(JSON.parse(saved)) } catch { /* ignore */ }
    }

    const sessionId = sessionStorage.getItem('sessionId')
    if (!sessionId) {
      setError(true)
      setLoading(false)
      return
    }

    fetch(`/api/load-session?sessionId=${sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (data.report) {
          setReport(JSON.parse(data.report))
          setLoading(false)
        } else {
          return fetch('/api/generate-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, messages: data.messages ?? [] }),
          })
            .then(r => r.json())
            .then(d => {
              setReport(d.report)
              setLoading(false)
            })
        }
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  const handleWaitlist = async () => {
    if (!waitlistEmail.trim()) return
    await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: waitlistEmail }),
    })
    setWaitlistSent(true)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-6">
        <ConstellationLoader />
        <div className="text-center max-w-sm">
          <p className="text-primary font-semibold mb-2 text-lg leading-snug">
            To nejzajímavější bývá často schované mezi řádky.
          </p>
          <p className="text-primary/55 text-sm leading-relaxed">
            Právě propojuji stopy, které se během našeho rozhovoru objevily,
            a skládám z nich tvou Osobní mapu<AnimatedDots />
          </p>
          <p className="text-primary/35 text-xs mt-3">
            Může to trvat až minutu — výsledek stojí za to.
          </p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="card max-w-md w-full p-10 text-center">
          <div className="text-5xl mb-6">💬</div>
          <h1 className="text-xl font-bold text-primary mb-3">Diagnostika ještě není hotová</h1>
          <p className="text-primary/70 mb-6 leading-relaxed">
            Report se vygeneruje až po dokončení všech 5 fází. Vrať se do chatu
            a pokračuj v rozhovoru — tlačítko pro report se objeví automaticky na konci.
          </p>
          <button onClick={() => router.push('/chat')} className="btn-primary">
            Zpět do chatu →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-peach">
      {/* Top bar — skryto při tisku */}
      <div className="no-print sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-pink-light px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <img src="/logo.svg" alt="inspiraise" className="h-6" />
          <button onClick={() => window.print()} className="btn-secondary text-sm px-4 py-2">
            Stáhnout jako PDF
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* 1. HERO */}
        <section className="report-hero p-8 md:p-12">
          <img src="/logo.svg" alt="inspiraise" className="h-7 mb-6 brightness-0 invert opacity-70" />
          <p className="text-sm tracking-widest text-white/50 uppercase mb-3">Mapa hodnoty</p>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight">
            Hodnotové<br />zrcadlo
          </h1>
          {report.heroInsight && (
            <blockquote className="border-l-4 border-orange pl-5 text-white/90 italic text-lg leading-relaxed mb-6">
              &ldquo;{report.heroInsight}&rdquo;
            </blockquote>
          )}
          <p className="text-white/80 leading-relaxed">{report.clientSummary}</p>
        </section>

        {/* 2. KRÁTKÉ ZRCADLO */}
        <section className="card p-7">
          <h2 className="text-lg font-bold text-primary mb-3">Krátké zrcadlo</h2>
          <p className="text-primary/80 leading-relaxed">{report.shortMirror}</p>
        </section>

        {/* 3. SILNÉ JÁDRO */}
        <section>
          <h2 className="text-xl font-bold text-primary mb-4">Silné jádro expertízy</h2>
          <div className="space-y-4">
            {report.coreStrengths?.map((s, i) => (
              <div key={i} className="card p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-primary text-base">{i + 1}. {s.title}</h3>
                  <span className="text-sm font-bold text-secondary ml-3 flex-shrink-0">{s.score}/10</span>
                </div>
                <div className="w-full bg-pink-light rounded-full h-1.5 mb-4">
                  <div className="progress-bar h-1.5" style={{ width: `${s.score * 10}%` }} />
                </div>
                <p className="text-primary/80 text-sm leading-relaxed mb-3">{s.description}</p>
                {s.evidence?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Důkazy z rozhovoru</p>
                    <ul className="space-y-1">
                      {s.evidence.map((e, j) => (
                        <li key={j} className="text-xs text-primary/70 flex items-start gap-2">
                          <span className="text-orange flex-shrink-0 mt-0.5">◆</span>{e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {s.whyItMatters && (
                  <p className="text-xs text-secondary italic">{s.whyItMatters}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 4. ENERGETICKÁ MAPA */}
        {(report.energyMap?.drains?.length > 0 || report.energyMap?.energizes?.length > 0) && (
          <section>
            <h2 className="text-xl font-bold text-primary mb-4">Energetická mapa</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card-pink p-6">
                <h3 className="font-bold text-primary mb-3 flex items-center gap-2">
                  <span className="text-lg">↓</span> Vysává tě
                </h3>
                <ul className="space-y-2">
                  {report.energyMap.drains.map((d, i) => (
                    <li key={i} className="text-sm text-primary/80 flex items-start gap-2">
                      <span className="text-primary/30 flex-shrink-0 mt-0.5">·</span>{d}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-primary mb-3 flex items-center gap-2">
                  <span className="text-lg">↑</span> Ožíváš v
                </h3>
                <ul className="space-y-2">
                  {report.energyMap.energizes.map((e, i) => (
                    <li key={i} className="text-sm text-primary/80 flex items-start gap-2">
                      <span className="text-orange flex-shrink-0 mt-0.5">◆</span>{e}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* 5. SLEPÁ MÍSTA */}
        {report.blindSpots?.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-primary mb-4">Slepá místa a shazující věty</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-4 text-primary/60 font-semibold bg-pink-light rounded-tl-xl w-1/2">Co o sobě říkáš</th>
                    <th className="text-left py-3 px-4 text-primary/60 font-semibold bg-pink-light rounded-tr-xl w-1/2">Co je pravda</th>
                  </tr>
                </thead>
                <tbody>
                  {report.blindSpots.map((b, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-peach'}>
                      <td className="py-3 px-4 text-primary/70 italic">&ldquo;{b.selfStatement}&rdquo;</td>
                      <td className="py-3 px-4 text-primary font-medium">{b.truth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 6. VZORCE */}
        {report.patterns?.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-primary mb-4">Opakující se vzorce</h2>
            <div className="space-y-3">
              {report.patterns.map((p, i) => (
                <div key={i} className="report-quote">
                  <p className="font-bold text-primary mb-1">{p.name}</p>
                  <p className="text-primary/70 text-sm">{p.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. ZÓNA VYSOKÉ HODNOTY */}
        {report.valueZone?.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-primary mb-4">Zóna vysoké hodnoty</h2>
            <div className="space-y-4">
              {report.valueZone.map((v, i) => (
                <div key={i} className="card-pink p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <h3 className="font-bold text-primary">{v.archetype}</h3>
                  </div>
                  <p className="text-primary/80 text-sm leading-relaxed mb-2">{v.description}</p>
                  {v.evidence && <p className="text-xs text-primary/50 italic">{v.evidence}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. CO DRŽET VS DELEGOVAT */}
        {(report.keepDelegate?.keep?.length > 0 || report.keepDelegate?.delegate?.length > 0) && (
          <section>
            <h2 className="text-xl font-bold text-primary mb-4">Co držet u sebe vs co delegovat</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card p-6">
                <h3 className="font-semibold text-primary mb-3">Drž u sebe</h3>
                <ul className="space-y-2">
                  {report.keepDelegate.keep.map((k, i) => (
                    <li key={i} className="text-sm text-primary/80 flex items-start gap-2">
                      <span className="text-secondary font-bold flex-shrink-0">✓</span>{k}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card-pink p-6">
                <h3 className="font-semibold text-primary mb-3">Deleguj nebo nedělej silou</h3>
                <ul className="space-y-2">
                  {report.keepDelegate.delegate.map((d, i) => (
                    <li key={i} className="text-sm text-primary/80 flex items-start gap-2">
                      <span className="text-orange flex-shrink-0">→</span>{d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* 9. SMĚRY NABÍDKY */}
        {report.offerDirections?.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-primary mb-4">Možné směry nabídky</h2>
            <div className="space-y-4">
              {report.offerDirections.map((o, i) => (
                <div key={i} className="card p-6">
                  <h3 className="font-bold text-primary mb-4">Směr {i + 1}: {o.name}</h3>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="bg-peach rounded-xl p-3">
                      <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Pro koho</p>
                      <p className="text-primary/80">{o.forWhom}</p>
                    </div>
                    <div className="bg-peach rounded-xl p-3">
                      <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">V jaké situaci</p>
                      <p className="text-primary/80">{o.inSituation}</p>
                    </div>
                    <div className="bg-peach rounded-xl p-3">
                      <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Co by získali</p>
                      <p className="text-primary/80">{o.whatTheyGet}</p>
                    </div>
                    <div className="bg-peach rounded-xl p-3">
                      <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Proč to sedí</p>
                      <p className="text-primary/80">{o.whyItFits}</p>
                    </div>
                  </div>
                  {o.watchOut && (
                    <p className="text-xs text-orange mt-3 italic">⚠ Pozor na: {o.watchOut}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 10. POSITIONING */}
        {report.positioningPhrases?.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-primary mb-4">Pracovní věty positioningu</h2>
            <div className="space-y-3">
              {report.positioningPhrases.map((phrase, i) => (
                <div key={i} className="report-quote">
                  <p className="text-primary italic">&ldquo;{phrase}&rdquo;</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 11. NAPĚTÍ */}
        {report.tensions?.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-primary mb-4">Vnitřní napětí a rozpory</h2>
            <div className="space-y-4">
              {report.tensions.map((t, i) => (
                <div key={i} className="card p-6">
                  <h3 className="font-bold text-primary mb-4">{t.title}</h3>
                  <div className="grid sm:grid-cols-2 gap-3 mb-3 text-sm">
                    <div className="card-pink p-3 rounded-xl">
                      <p className="text-xs font-semibold text-primary/50 mb-1">Na jedné straně říkáš</p>
                      <p className="text-primary/80 italic">&ldquo;{t.sideA}&rdquo;</p>
                    </div>
                    <div className="bg-peach border border-pink-light p-3 rounded-xl">
                      <p className="text-xs font-semibold text-primary/50 mb-1">V příkladech se ukazuje</p>
                      <p className="text-primary/80">{t.sideB}</p>
                    </div>
                  </div>
                  <p className="text-sm text-primary/70 mb-2">{t.meaning}</p>
                  <p className="text-sm text-secondary italic">→ {t.question}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 12. DALŠÍ KROKY */}
        {report.nextSteps?.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-primary mb-4">Doporučené další kroky</h2>
            <div className="space-y-3">
              {report.nextSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-4 card p-5">
                  <span className="w-7 h-7 rounded-full gradient-primary flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-primary/80 text-sm leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 13. ZÁVĚREČNÉ ZRCADLO */}
        {report.closingMirror && (
          <section className="report-hero p-8">
            <h2 className="text-lg font-bold text-white/70 mb-4">Závěrečné zrcadlo</h2>
            <p className="text-white leading-relaxed text-base">{report.closingMirror}</p>
          </section>
        )}

        {/* 14. AHA MOMENTY */}
        {ahaThoughts.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-primary mb-4">Moje aha momenty</h2>
            <div className="space-y-3">
              {ahaThoughts.map((t, i) => (
                <div key={i} className="report-quote flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">⭐</span>
                  <div>
                    <p className="text-xs text-primary/40 uppercase tracking-wider mb-1 font-semibold">
                      {t.role === 'assistant' ? 'Poznámka kouče' : 'Moje myšlenka'}
                    </p>
                    <p className="text-primary/80 text-sm leading-relaxed">{t.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA — tisknutelná verze (jen v PDF) */}
        <section className="hidden print:block print-break-before">
          <div className="report-hero p-8 text-center">
            <img src="/logo.svg" alt="inspiraise" className="h-7 mx-auto mb-5 brightness-0 invert opacity-70" />
            <h2 className="text-2xl font-bold text-white mb-3">Chceš s tím pracovat dál?</h2>
            <p className="text-white/80 mb-6 max-w-lg mx-auto leading-relaxed">
              Teď víš, kde je tvoje hodnota. Dalším krokem je přetavit ji do nabídky,
              ceny a komunikace — přesně to děláme v individuální konzultaci.
            </p>
            <div className="bg-white/15 rounded-2xl p-6 max-w-sm mx-auto">
              <p className="text-white font-bold mb-1">Rezervuj konzultaci</p>
              <p className="text-white/70 text-sm mb-3">90 minut · zvýhodněná cena pro klientky Hodnotového zrcadla</p>
              <p className="text-orange font-semibold text-base">
                {process.env.NEXT_PUBLIC_CALENDLY_URL ?? 'lenkapechrova.cz'}
              </p>
            </div>
            <p className="text-white/40 text-xs mt-6">© {new Date().getFullYear()} inspiraise</p>
          </div>
        </section>

        {/* UPSELL — webová verze (skryta v PDF) */}
        <section className="no-print pt-4 border-t-2 border-pink-light">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-primary mb-2">Chceš s tím pracovat dál?</h2>
            <p className="text-primary/60 text-sm max-w-md mx-auto">
              Toto je mapa. Teď ji potřebuješ přetavit do konkrétní nabídky, ceny a komunikace.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-7 flex flex-col">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-lg font-bold text-primary mb-2">Individuální konzultace</h3>
              <p className="text-primary/70 text-sm leading-relaxed flex-1 mb-5">
                90 minut práce jedna na jednu. Vezmeme výsledky tvého reportu a proměníme je
                v konkrétní nabídku, cenu a první výstup ven. Zvýhodněná cena pro klientky
                Hodnotového zrcadla.
              </p>
              <a
                href={process.env.NEXT_PUBLIC_CALENDLY_URL ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-center block"
              >
                Rezervovat termín →
              </a>
            </div>

            <div className="card-pink p-7 flex flex-col">
              <div className="text-3xl mb-3">✨</div>
              <h3 className="text-lg font-bold text-primary mb-2">Business Atelier</h3>
              <p className="text-primary/70 text-sm leading-relaxed flex-1 mb-5">
                Skupinový program, ve kterém stavíme byznys na tvých hodnotách a silných jádrech.
                Momentálně obsazeno — zapiš se na čekací listinu jako první.
              </p>
              {waitlistSent ? (
                <div className="bg-white rounded-xl px-4 py-3 text-center">
                  <p className="text-primary font-semibold text-sm">🎉 Zapsáno! Ozvu se ti jako první.</p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={e => setWaitlistEmail(e.target.value)}
                    placeholder="tvuj@email.cz"
                    className="flex-1 bg-white border border-pink-light rounded-xl px-3 py-2.5 text-sm text-primary placeholder:text-primary/40 focus:outline-none focus:border-secondary"
                  />
                  <button onClick={handleWaitlist} className="btn-primary px-4 py-2.5 text-sm flex-shrink-0">
                    Chci být první
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="text-center text-xs text-primary/40 pb-6 no-print">
          © {new Date().getFullYear()} inspiraise · Hodnotové zrcadlo · Mapa hodnoty
        </footer>
      </div>
    </div>
  )
}

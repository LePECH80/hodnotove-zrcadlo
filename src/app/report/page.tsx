'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// QR kód na odkaz konzultace (https://form.fapi.cz/?id=00965c12-...) — viewBox 0 0 37 37
const QR_CONSULTATION_PATH = 'M2,2H3V3H2zM3,2H4V3H3zM4,2H5V3H4zM5,2H6V3H5zM6,2H7V3H6zM7,2H8V3H7zM8,2H9V3H8zM11,2H12V3H11zM12,2H13V3H12zM16,2H17V3H16zM21,2H22V3H21zM23,2H24V3H23zM25,2H26V3H25zM28,2H29V3H28zM29,2H30V3H29zM30,2H31V3H30zM31,2H32V3H31zM32,2H33V3H32zM33,2H34V3H33zM34,2H35V3H34zM2,3H3V4H2zM8,3H9V4H8zM11,3H12V4H11zM13,3H14V4H13zM17,3H18V4H17zM20,3H21V4H20zM22,3H23V4H22zM26,3H27V4H26zM28,3H29V4H28zM34,3H35V4H34zM2,4H3V5H2zM4,4H5V5H4zM5,4H6V5H5zM6,4H7V5H6zM8,4H9V5H8zM10,4H11V5H10zM11,4H12V5H11zM12,4H13V5H12zM13,4H14V5H13zM14,4H15V5H14zM16,4H17V5H16zM18,4H19V5H18zM21,4H22V5H21zM22,4H23V5H22zM23,4H24V5H23zM25,4H26V5H25zM28,4H29V5H28zM30,4H31V5H30zM31,4H32V5H31zM32,4H33V5H32zM34,4H35V5H34zM2,5H3V6H2zM4,5H5V6H4zM5,5H6V6H5zM6,5H7V6H6zM8,5H9V6H8zM10,5H11V6H10zM11,5H12V6H11zM17,5H18V6H17zM19,5H20V6H19zM20,5H21V6H20zM21,5H22V6H21zM22,5H23V6H22zM24,5H25V6H24zM25,5H26V6H25zM26,5H27V6H26zM28,5H29V6H28zM30,5H31V6H30zM31,5H32V6H31zM32,5H33V6H32zM34,5H35V6H34zM2,6H3V7H2zM4,6H5V7H4zM5,6H6V7H5zM6,6H7V7H6zM8,6H9V7H8zM10,6H11V7H10zM12,6H13V7H12zM14,6H15V7H14zM18,6H19V7H18zM19,6H20V7H19zM21,6H22V7H21zM23,6H24V7H23zM25,6H26V7H25zM28,6H29V7H28zM30,6H31V7H30zM31,6H32V7H31zM32,6H33V7H32zM34,6H35V7H34zM2,7H3V8H2zM8,7H9V8H8zM10,7H11V8H10zM11,7H12V8H11zM16,7H17V8H16zM17,7H18V8H17zM18,7H19V8H18zM19,7H20V8H19zM24,7H25V8H24zM28,7H29V8H28zM34,7H35V8H34zM2,8H3V9H2zM3,8H4V9H3zM4,8H5V9H4zM5,8H6V9H5zM6,8H7V9H6zM7,8H8V9H7zM8,8H9V9H8zM10,8H11V9H10zM12,8H13V9H12zM14,8H15V9H14zM16,8H17V9H16zM18,8H19V9H18zM20,8H21V9H20zM22,8H23V9H22zM24,8H25V9H24zM26,8H27V9H26zM28,8H29V9H28zM29,8H30V9H29zM30,8H31V9H30zM31,8H32V9H31zM32,8H33V9H32zM33,8H34V9H33zM34,8H35V9H34zM10,9H11V10H10zM11,9H12V10H11zM12,9H13V10H12zM13,9H14V10H13zM14,9H15V10H14zM16,9H17V10H16zM23,9H24V10H23zM2,10H3V11H2zM4,10H5V11H4zM5,10H6V11H5zM6,10H7V11H6zM7,10H8V11H7zM8,10H9V11H8zM11,10H12V11H11zM12,10H13V11H12zM13,10H14V11H13zM15,10H16V11H15zM16,10H17V11H16zM17,10H18V11H17zM18,10H19V11H18zM19,10H20V11H19zM21,10H22V11H21zM24,10H25V11H24zM25,10H26V11H25zM26,10H27V11H26zM28,10H29V11H28zM29,10H30V11H29zM30,10H31V11H30zM31,10H32V11H31zM32,10H33V11H32zM4,11H5V12H4zM5,11H6V12H5zM7,11H8V12H7zM12,11H13V12H12zM14,11H15V12H14zM15,11H16V12H15zM20,11H21V12H20zM21,11H22V12H21zM23,11H24V12H23zM25,11H26V12H25zM26,11H27V12H26zM28,11H29V12H28zM29,11H30V12H29zM31,11H32V12H31zM32,11H33V12H32zM34,11H35V12H34zM3,12H4V13H3zM4,12H5V13H4zM5,12H6V13H5zM6,12H7V13H6zM8,12H9V13H8zM9,12H10V13H9zM12,12H13V13H12zM14,12H15V13H14zM15,12H16V13H15zM16,12H17V13H16zM17,12H18V13H17zM18,12H19V13H18zM19,12H20V13H19zM20,12H21V13H20zM23,12H24V13H23zM27,12H28V13H27zM28,12H29V13H28zM30,12H31V13H30zM32,12H33V13H32zM4,13H5V14H4zM5,13H6V14H5zM6,13H7V14H6zM10,13H11V14H10zM13,13H14V14H13zM15,13H16V14H15zM17,13H18V14H17zM20,13H21V14H20zM21,13H22V14H21zM23,13H24V14H23zM24,13H25V14H24zM27,13H28V14H27zM30,13H31V14H30zM31,13H32V14H31zM32,13H33V14H32zM34,13H35V14H34zM8,14H9V15H8zM10,14H11V15H10zM13,14H14V15H13zM16,14H17V15H16zM18,14H19V15H18zM19,14H20V15H19zM21,14H22V15H21zM22,14H23V15H22zM25,14H26V15H25zM26,14H27V15H26zM29,14H30V15H29zM30,14H31V15H30zM31,14H32V15H31zM2,15H3V16H2zM4,15H5V16H4zM5,15H6V16H5zM11,15H12V16H11zM12,15H13V16H12zM13,15H14V16H13zM14,15H15V16H14zM19,15H20V16H19zM20,15H21V16H20zM21,15H22V16H21zM23,15H24V16H23zM24,15H25V16H24zM25,15H26V16H25zM26,15H27V16H26zM27,15H28V16H27zM28,15H29V16H28zM29,15H30V16H29zM31,15H32V16H31zM33,15H34V16H33zM34,15H35V16H34zM3,16H4V17H3zM5,16H6V17H5zM6,16H7V17H6zM8,16H9V17H8zM9,16H10V17H9zM10,16H11V17H10zM12,16H13V17H12zM13,16H14V17H13zM15,16H16V17H15zM16,16H17V17H16zM17,16H18V17H17zM18,16H19V17H18zM20,16H21V17H20zM23,16H24V17H23zM26,16H27V17H26zM27,16H28V17H27zM28,16H29V17H28zM29,16H30V17H29zM31,16H32V17H31zM32,16H33V17H32zM33,16H34V17H33zM2,17H3V18H2zM3,17H4V18H3zM4,17H5V18H4zM5,17H6V18H5zM6,17H7V18H6zM7,17H8V18H7zM10,17H11V18H10zM11,17H12V18H11zM12,17H13V18H12zM15,17H16V18H15zM17,17H18V18H17zM21,17H22V18H21zM23,17H24V18H23zM24,17H25V18H24zM25,17H26V18H25zM26,17H27V18H26zM27,17H28V18H27zM28,17H29V18H28zM29,17H30V18H29zM32,17H33V18H32zM3,18H4V19H3zM5,18H6V19H5zM6,18H7V19H6zM7,18H8V19H7zM8,18H9V19H8zM11,18H12V19H11zM13,18H14V19H13zM14,18H15V19H14zM17,18H18V19H17zM18,18H19V19H18zM19,18H20V19H19zM22,18H23V19H22zM24,18H25V19H24zM26,18H27V19H26zM27,18H28V19H27zM29,18H30V19H29zM30,18H31V19H30zM31,18H32V19H31zM34,18H35V19H34zM3,19H4V20H3zM4,19H5V20H4zM6,19H7V20H6zM13,19H14V20H13zM20,19H21V20H20zM21,19H22V20H21zM22,19H23V20H22zM24,19H25V20H24zM25,19H26V20H25zM28,19H29V20H28zM29,19H30V20H29zM31,19H32V20H31zM32,19H33V20H32zM33,19H34V20H33zM34,19H35V20H34zM7,20H8V21H7zM8,20H9V21H8zM9,20H10V21H9zM10,20H11V21H10zM11,20H12V21H11zM16,20H17V21H16zM17,20H18V21H17zM22,20H23V21H22zM23,20H24V21H23zM26,20H27V21H26zM27,20H28V21H27zM29,20H30V21H29zM30,20H31V21H30zM32,20H33V21H32zM3,21H4V22H3zM4,21H5V22H4zM5,21H6V22H5zM6,21H7V22H6zM7,21H8V22H7zM9,21H10V22H9zM11,21H12V22H11zM13,21H14V22H13zM16,21H17V22H16zM17,21H18V22H17zM20,21H21V22H20zM21,21H22V22H21zM23,21H24V22H23zM24,21H25V22H24zM25,21H26V22H25zM26,21H27V22H26zM29,21H30V22H29zM30,21H31V22H30zM31,21H32V22H31zM32,21H33V22H32zM33,21H34V22H33zM2,22H3V23H2zM3,22H4V23H3zM5,22H6V23H5zM8,22H9V23H8zM9,22H10V23H9zM11,22H12V23H11zM13,22H14V23H13zM14,22H15V23H14zM16,22H17V23H16zM17,22H18V23H17zM18,22H19V23H18zM19,22H20V23H19zM20,22H21V23H20zM24,22H25V23H24zM26,22H27V23H26zM30,22H31V23H30zM31,22H32V23H31zM2,23H3V24H2zM3,23H4V24H3zM9,23H10V24H9zM11,23H12V24H11zM13,23H14V24H13zM15,23H16V24H15zM16,23H17V24H16zM21,23H22V24H21zM22,23H23V24H22zM23,23H24V24H23zM25,23H26V24H25zM27,23H28V24H27zM28,23H29V24H28zM29,23H30V24H29zM31,23H32V24H31zM32,23H33V24H32zM34,23H35V24H34zM2,24H3V25H2zM6,24H7V25H6zM7,24H8V25H7zM8,24H9V25H8zM9,24H10V25H9zM10,24H11V25H10zM12,24H13V25H12zM15,24H16V25H15zM16,24H17V25H16zM17,24H18V25H17zM18,24H19V25H18zM23,24H24V25H23zM26,24H27V25H26zM27,24H28V25H27zM31,24H32V25H31zM33,24H34V25H33zM2,25H3V26H2zM4,25H5V26H4zM5,25H6V26H5zM6,25H7V26H6zM9,25H10V26H9zM10,25H11V26H10zM12,25H13V26H12zM13,25H14V26H13zM15,25H16V26H15zM16,25H17V26H16zM20,25H21V26H20zM21,25H22V26H21zM22,25H23V26H22zM23,25H24V26H23zM28,25H29V26H28zM31,25H32V26H31zM32,25H33V26H32zM33,25H34V26H33zM2,26H3V27H2zM4,26H5V27H4zM6,26H7V27H6zM7,26H8V27H7zM8,26H9V27H8zM10,26H11V27H10zM12,26H13V27H12zM13,26H14V27H13zM15,26H16V27H15zM16,26H17V27H16zM17,26H18V27H17zM18,26H19V27H18zM19,26H20V27H19zM20,26H21V27H20zM24,26H25V27H24zM26,26H27V27H26zM27,26H28V27H27zM28,26H29V27H28zM29,26H30V27H29zM30,26H31V27H30zM33,26H34V27H33zM34,26H35V27H34zM10,27H11V28H10zM11,27H12V28H11zM14,27H15V28H14zM15,27H16V28H15zM21,27H22V28H21zM22,27H23V28H22zM23,27H24V28H23zM25,27H26V28H25zM26,27H27V28H26zM30,27H31V28H30zM32,27H33V28H32zM33,27H34V28H33zM34,27H35V28H34zM2,28H3V29H2zM3,28H4V29H3zM4,28H5V29H4zM5,28H6V29H5zM6,28H7V29H6zM7,28H8V29H7zM8,28H9V29H8zM11,28H12V29H11zM15,28H16V29H15zM16,28H17V29H16zM17,28H18V29H17zM19,28H20V29H19zM23,28H24V29H23zM25,28H26V29H25zM26,28H27V29H26zM28,28H29V29H28zM30,28H31V29H30zM32,28H33V29H32zM2,29H3V30H2zM8,29H9V30H8zM10,29H11V30H10zM17,29H18V30H17zM20,29H21V30H20zM21,29H22V30H21zM22,29H23V30H22zM23,29H24V30H23zM24,29H25V30H24zM25,29H26V30H25zM26,29H27V30H26zM30,29H31V30H30zM31,29H32V30H31zM32,29H33V30H32zM33,29H34V30H33zM34,29H35V30H34zM2,30H3V31H2zM4,30H5V31H4zM5,30H6V31H5zM6,30H7V31H6zM8,30H9V31H8zM10,30H11V31H10zM13,30H14V31H13zM14,30H15V31H14zM15,30H16V31H15zM17,30H18V31H17zM18,30H19V31H18zM19,30H20V31H19zM20,30H21V31H20zM21,30H22V31H21zM22,30H23V31H22zM26,30H27V31H26zM27,30H28V31H27zM28,30H29V31H28zM29,30H30V31H29zM30,30H31V31H30zM31,30H32V31H31zM2,31H3V32H2zM4,31H5V32H4zM5,31H6V32H5zM6,31H7V32H6zM8,31H9V32H8zM10,31H11V32H10zM15,31H16V32H15zM19,31H20V32H19zM21,31H22V32H21zM25,31H26V32H25zM27,31H28V32H27zM30,31H31V32H30zM31,31H32V32H31zM32,31H33V32H32zM33,31H34V32H33zM34,31H35V32H34zM2,32H3V33H2zM4,32H5V33H4zM5,32H6V33H5zM6,32H7V33H6zM8,32H9V33H8zM10,32H11V33H10zM11,32H12V33H11zM12,32H13V33H12zM14,32H15V33H14zM16,32H17V33H16zM17,32H18V33H17zM18,32H19V33H18zM22,32H23V33H22zM23,32H24V33H23zM25,32H26V33H25zM28,32H29V33H28zM29,32H30V33H29zM2,33H3V34H2zM8,33H9V34H8zM11,33H12V34H11zM13,33H14V34H13zM14,33H15V34H14zM15,33H16V34H15zM17,33H18V34H17zM22,33H23V34H22zM23,33H24V34H23zM24,33H25V34H24zM25,33H26V34H25zM28,33H29V34H28zM30,33H31V34H30zM32,33H33V34H32zM2,34H3V35H2zM3,34H4V35H3zM4,34H5V35H4zM5,34H6V35H5zM6,34H7V35H6zM7,34H8V35H7zM8,34H9V35H8zM10,34H11V35H10zM13,34H14V35H13zM14,34H15V35H14zM15,34H16V35H15zM16,34H17V35H16zM18,34H19V35H18zM19,34H20V35H19zM20,34H21V35H20zM21,34H22V35H21zM26,34H27V35H26zM27,34H28V35H27zM29,34H30V35H29zM31,34H32V35H31zM33,34H34V35H33z'

interface Strength {
  title: string
  description: string
  evidence: string[]
  whyItMatters: string
  score: number
}

interface Direction {
  name: string
  forWhom: string
  why: string
}

interface StrengthVsRisk {
  strength: string
  helpsWhen: string
  risksWhen: string
  watchOut: string
}

interface ReportData {
  heroInsight: string
  clientSummary: string
  coreStrengths: Strength[]
  energyMap: { drains: string[]; energizes: string[] }
  blindSpots: { selfStatement: string; truth: string }[]
  strengthVsRisk?: StrengthVsRisk[]
  moreLess?: { more: string[]; less: string[] }
  directions?: Direction[]
  firstSteps?: string[]
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

function ReportPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [noAccess, setNoAccess] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistSent, setWaitlistSent] = useState(false)
  const [ahaThoughts, setAhaThoughts] = useState<SavedThought[]>([])

  // Načti hotový report, nebo ho vygeneruj — s opakováním (generování může na Hobby občas selhat)
  const loadOrGenerate = async (sid: string, maxAttempts = 3) => {
    setLoading(true)
    setError(false)
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const ls = await fetch(`/api/load-session?sessionId=${sid}`).then(r => r.json())
        if (ls.report) {
          setReport(typeof ls.report === 'string' ? JSON.parse(ls.report) : ls.report)
          setLoading(false)
          return
        }
        const res = await fetch('/api/generate-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid, messages: ls.messages ?? [] }),
        })
        const d = await res.json()
        if (res.ok && d.report) {
          setReport(d.report)
          setLoading(false)
          return
        }
      } catch {
        /* síťová chyba — zkusíme znovu */
      }
      if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 1500))
    }
    setError(true)
    setLoading(false)
  }

  useEffect(() => {
    // Načti uložené myšlenky
    const saved = localStorage.getItem('savedThoughts') ?? sessionStorage.getItem('savedThoughts')
    if (saved) {
      try { setAhaThoughts(JSON.parse(saved)) } catch { /* ignore */ }
    }

    // sessionId z URL parametru (z emailu) nebo z úložiště
    const urlSessionId = searchParams.get('session')
    const sid = urlSessionId || localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId')
    if (!sid) {
      setNoAccess(true)
      setLoading(false)
      return
    }
    setSessionId(sid)
    loadOrGenerate(sid)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
            Může to trvat 1 až 2 minuty. Nech prosím tuhle stránku otevřenou.
          </p>
        </div>
      </div>
    )
  }

  if (noAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="card max-w-md w-full p-10 text-center">
          <div className="text-5xl mb-6">🔗</div>
          <h1 className="text-xl font-bold text-primary mb-3">Otevři prosím odkaz z e-mailu</h1>
          <p className="text-primary/70 mb-6 leading-relaxed">
            Tahle stránka neumí načíst tvůj report bez přístupu. Klikni prosím na odkaz
            v e-mailu a budeš pokračovat tam, kde jsi přestal(a).
          </p>
          <button onClick={() => router.push('/chat')} className="btn-primary">
            Zpět do chatu →
          </button>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="card max-w-md w-full p-10 text-center">
          <div className="text-5xl mb-6">🛠️</div>
          <h1 className="text-xl font-bold text-primary mb-3">Skládání mapy se zaseklo</h1>
          <p className="text-primary/70 mb-6 leading-relaxed">
            Nic se neztratilo, tvůj rozhovor je v bezpečí. Občas se generování nepovede napoprvé,
            stačí to zkusit znovu.
          </p>
          <button
            onClick={() => sessionId && loadOrGenerate(sessionId)}
            className="btn-primary mb-4"
          >
            Zkusit znovu →
          </button>
          <p className="text-primary/50 text-sm">
            Kdyby to nešlo ani na druhý pokus, napiš mi na{' '}
            <a href="mailto:lenka.pechrova@inspiraise.com" className="text-secondary underline underline-offset-2">lenka.pechrova@inspiraise.com</a>{' '}
            a mapu ti pošlu.
          </p>
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

        {/* SÍLA × RIZIKO */}
        {report.strengthVsRisk?.length ? (
          <section>
            <h2 className="text-xl font-bold text-primary mb-4">Síla × Riziko</h2>
            <p className="text-sm text-primary/60 mb-4">Každá silná stránka má svůj stín. Tady vidíš celou realitu.</p>
            <div className="space-y-5">
              {report.strengthVsRisk.map((s, i) => (
                <div key={i} className="card p-6">
                  <h3 className="font-bold text-primary mb-4">{s.strength}</h3>
                  <div className="grid sm:grid-cols-3 gap-3 text-sm">
                    <div className="bg-peach rounded-xl p-3">
                      <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Kde pomáhá</p>
                      <p className="text-primary/80">{s.helpsWhen}</p>
                    </div>
                    <div className="card-pink p-3 rounded-xl">
                      <p className="text-xs font-semibold text-primary/50 uppercase tracking-wider mb-1">Kde může škodit</p>
                      <p className="text-primary/80">{s.risksWhen}</p>
                    </div>
                    <div className="card-pink p-3 rounded-xl">
                      <p className="text-xs font-semibold text-orange uppercase tracking-wider mb-1">Pozor na</p>
                      <p className="text-primary/80">{s.watchOut}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* CO DĚLAT VÍCE / MÉNĚ */}
        {(report.moreLess?.more?.length ?? 0) > 0 || (report.moreLess?.less?.length ?? 0) > 0 ? (
          <section>
            <h2 className="text-xl font-bold text-primary mb-4">Co dělat více a méně</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card p-6">
                <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <span className="text-lg text-secondary">↑</span> Dělat více
                </h3>
                <ul className="space-y-2">
                  {report.moreLess!.more.map((item, i) => (
                    <li key={i} className="text-sm text-primary/80 flex items-start gap-2">
                      <span className="text-orange flex-shrink-0 mt-0.5">◆</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card-pink p-6">
                <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <span className="text-lg text-primary/40">↓</span> Dělat méně
                </h3>
                <ul className="space-y-2">
                  {report.moreLess!.less.map((item, i) => (
                    <li key={i} className="text-sm text-primary/80 flex items-start gap-2">
                      <span className="text-primary/30 flex-shrink-0 mt-0.5">·</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ) : null}

        {/* SMĚRY NABÍDKY */}
        {report.directions?.length ? (
          <section>
            <h2 className="text-xl font-bold text-primary mb-4">Možné směry, kam s tím dál</h2>
            <div className="space-y-3">
              {report.directions.map((d, i) => (
                <div key={i} className="card p-6">
                  <h3 className="font-bold text-primary mb-1">Směr {i + 1}: {d.name}</h3>
                  <p className="text-primary/70 text-sm mb-2">{d.forWhom}</p>
                  <p className="text-secondary text-sm italic">{d.why}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* PRVNÍ KROKY */}
        {report.firstSteps?.length ? (
          <section>
            <h2 className="text-xl font-bold text-primary mb-4">První kroky</h2>
            <div className="space-y-3">
              {report.firstSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-4 card p-5">
                  <span className="w-7 h-7 rounded-full gradient-primary flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-primary/80 text-sm leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* 18. ZÁVĚREČNÉ ZRCADLO */}
        {report.closingMirror && (
          <section className="report-hero p-8">
            <h2 className="text-lg font-bold text-white/70 mb-4">Závěrečné zrcadlo</h2>
            <p className="text-white leading-relaxed text-base">{report.closingMirror}</p>
          </section>
        )}

        {/* 19. AHA MOMENTY */}
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
          {/* Tmavý text na světlém — aby se spolehlivě vytisklo i bez pozadí */}
          <div className="p-8 text-center" style={{ border: '2px solid #e4bdd1', borderRadius: '16px' }}>
            <img src="/logo.svg" alt="inspiraise" className="h-7 mx-auto mb-5" />
            <h2 className="text-2xl font-bold text-primary mb-3">Chceš s tím pracovat dál?</h2>
            <p className="text-primary/75 mb-5 max-w-lg mx-auto leading-relaxed">
              Teď máš mapu a v ní možné směry, kam to vzít dál. Na konzultaci spolu
              vybereme jeden z nich a uděláme z něj konkrétní nabídku, cenu a první krok ven.
              60 minut jedna na jednu, zvýhodněná cena pro klientky Hodnotového zrcadla.
            </p>
            <p className="text-primary font-bold mb-3">Domluvit konzultaci, naskenuj nebo otevři odkaz:</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <svg viewBox="0 0 37 37" width="120" height="120" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <rect width="37" height="37" fill="#ffffff" />
                <path d={QR_CONSULTATION_PATH} fill="#58113c" />
              </svg>
              <p className="text-secondary font-semibold text-sm" style={{ wordBreak: 'break-all', maxWidth: '220px' }}>
                form.fapi.cz/?id=00965c12-7f50-494b-ba9a-6b812d69313a
              </p>
            </div>
            <div style={{ borderTop: '1px solid #e4bdd1', paddingTop: '16px', marginTop: '8px' }}>
              <p className="text-primary font-semibold">Lenka Pechrová · Inspiraise</p>
              <p className="text-primary/70 text-sm">
                lenka.pechrova@inspiraise.com · inspiraise.com · Instagram: @lenka_pechrova_inspiraise
              </p>
            </div>
          </div>
        </section>

        {/* UPSELL — webová verze (skryta v PDF) */}
        <section className="no-print pt-4 border-t-2 border-pink-light">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-primary mb-2">Tvoje mapa je hotová. Co teď?</h2>
            <p className="text-primary/65 text-sm max-w-lg mx-auto leading-relaxed">
              Teď víš, v čem je tvoje hodnota a kde vzniká. To je velký kus cesty. Jenže vidět
              svoji hodnotu a umět z ní žít jsou dvě různé věci, a ta druhá bývá těžší. Přesně
              v tomhle přechodu ti umím pomoct, ať nezůstaneš jen u hezké mapy v šuplíku.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-7 flex flex-col">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-lg font-bold text-primary mb-2">Individuální konzultace</h3>
              <p className="text-primary/70 text-sm leading-relaxed flex-1 mb-5">
                60 minut jedna na jednu. Vezmeme tvoje možné směry z reportu, vybereme spolu ten
                jeden s největším smyslem a uděláme z něj reálnou nabídku, cenu a první krok.
                Zvýhodněná cena pro klientky Hodnotového zrcadla.
              </p>
              <a
                href="https://form.fapi.cz/?id=00965c12-7f50-494b-ba9a-6b812d69313a"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-center block"
              >
                Koupit konzultaci →
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
          © {new Date().getFullYear()} Inspiraise s.r.o. · Osobní mapa hodnoty
        </footer>
      </div>
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense>
      <ReportPageContent />
    </Suspense>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const REPORT_SYSTEM_PROMPT = `Jsi expert na analýzu hodnotových diagnostik. Na základě přiložené konverzace z diagnostiky vygeneruj strukturovaný osobní report — Mapu hodnoty.

Klíčové zásady:
- Každý závěr musí být opřený o konkrétní odpovědi z konverzace.
- Nikdy nevymýšlej insighty, které z odpovědí nevyplývají.
- Používej konkrétní formulace z odpovědí klientky.
- Piš v ženském rodě, osobně, přesně, bez motivační omáčky.
- Pokud znáš jméno klientky, skloňuj ho vždy do vokativu (5. pád): Lenka → Lenko, Jana → Jano, Petra → Petro, Markéta → Markéto.
- Report musí působit jako hluboké osobní zrcadlo, ne jako AI generátor osobnosti.

Odpověz POUZE validním JSON objektem (bez markdown bloků, bez dalšího textu) v tomto přesném formátu:

{
  "heroInsight": "Jedna silná věta — největší insight z celé diagnostiky. Osobní, přesná, emočně silná.",
  "clientSummary": "2–3 věty shrnující podstatu její hodnoty. Nech to být přesné a lidské.",
  "shortMirror": "3–5 vět jako krátké zrcadlo toho, co se ukázalo. Přesné, ne přehnaně motivační.",
  "coreStrengths": [
    {
      "title": "Název silného jádra",
      "description": "Co to znamená v praxi — 2–3 věty.",
      "evidence": ["konkrétní situace nebo věta z rozhovoru", "další důkaz"],
      "whyItMatters": "Proč je to hodnota pro druhé — 1 věta.",
      "score": 9
    }
  ],
  "energyMap": {
    "drains": ["Co ji vysává 1 — konkrétní, ne obecné", "Co ji vysává 2", "Co ji vysává 3"],
    "energizes": ["Kde ožívá 1 — konkrétní situace nebo typ práce", "Kde ožívá 2", "Kde ožívá 3"]
  },
  "blindSpots": [
    {
      "selfStatement": "Co o sobě říká — její konkrétní věta nebo typ věty",
      "truth": "Co je pravda — přesnější přerámování"
    }
  ],
  "patterns": [
    {
      "name": "Název vzorce — např. Chaos → jasný směr",
      "description": "Krátké vysvětlení vzorce — 1–2 věty."
    }
  ],
  "valueZone": [
    {
      "archetype": "Název archetypu — např. Diagnostik, Překladatel, Aktivátor",
      "description": "Co to v praxi znamená pro ni — 2 věty.",
      "evidence": "O co se to opírá z rozhovoru."
    }
  ],
  "keepDelegate": {
    "keep": ["Co držet u sebe 1", "Co držet u sebe 2", "Co držet u sebe 3"],
    "delegate": ["Co delegovat 1", "Co delegovat 2", "Co delegovat 3"]
  },
  "offerDirections": [
    {
      "name": "Název směru nabídky",
      "forWhom": "Pro koho — typ klienta",
      "inSituation": "V jaké situaci tě potřebují",
      "whatTheyGet": "Co by získali — konkrétní výsledek",
      "whyItFits": "Proč to sedí na její hodnotu",
      "watchOut": "Na co si dát pozor"
    }
  ],
  "positioningPhrases": [
    "Pomáhám [komu], když [situace], aby [výsledek].",
    "Pracovní věta 2 — jiný tón nebo konkrétnost.",
    "Pracovní věta 3."
  ],
  "tensions": [
    {
      "title": "Napětí 1: [A] vs [B]",
      "sideA": "Co na jedné straně říká",
      "sideB": "Co se v příkladech opakovaně ukazuje",
      "meaning": "Co to může znamenat — opatrná interpretace.",
      "question": "Otázka k dalšímu promyšlení."
    }
  ],
  "nextSteps": ["Konkrétní další krok 1", "Konkrétní další krok 2", "Konkrétní další krok 3"],
  "closingMirror": "Závěrečné zrcadlo — 3–5 silných vět, které uzavírají celou diagnostiku a dávají pocit: Jo. Tohle dává smysl."
}`

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, messages } = await req.json() as {
      sessionId: string
      messages: Message[]
    }

    if (!sessionId || !messages?.length) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const conversationText = messages
      .map(m => `${m.role === 'user' ? 'Klientka' : 'Kouč'}: ${m.content}`)
      .join('\n\n')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: REPORT_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Zde je průběh diagnostiky Hodnotového zrcadla:\n\n${conversationText}\n\nVygeneruj kompletní Mapu hodnoty jako JSON podle zadané struktury.`,
        },
      ],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '{}'

    let reportData
    try {
      // Strip markdown code fences anywhere in the text
      let cleaned = rawText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim()

      // If still not valid, extract the first {...} block
      if (!cleaned.startsWith('{')) {
        const match = cleaned.match(/\{[\s\S]*\}/)
        if (match) cleaned = match[0]
      }

      reportData = JSON.parse(cleaned)
    } catch (parseErr) {
      console.error('Parse error, raw text:', rawText.slice(0, 500))
      return NextResponse.json({ error: 'Failed to parse report', raw: rawText.slice(0, 300) }, { status: 500 })
    }

    // Save to Supabase
    const supabase = createClient()
    await supabase
      .from('sessions')
      .update({ report: JSON.stringify(reportData) })
      .eq('id', sessionId)

    return NextResponse.json({ report: reportData })
  } catch (err) {
    console.error('Generate report error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

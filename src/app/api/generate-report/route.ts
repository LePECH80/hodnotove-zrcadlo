import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function toVocative(fullName: string): string {
  const first = fullName.trim().split(' ')[0]
  const name = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
  if (name.endsWith('a') || name.endsWith('á')) return name.slice(0, -1) + 'o'
  if (name.endsWith('el') || name.endsWith('il')) return name + 'i'
  if (name.endsWith('r')) return name + 'e'
  if (name.endsWith('n')) return name + 'e'
  if (name.endsWith('k')) return name.slice(0, -1) + 'ku'
  return name
}

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
  "moreLess": {
    "more": [
      "Situace, role nebo typ práce, kde se silné stránky opakovaně projevovaly — co dělat více 1",
      "Co dělat více 2",
      "Co dělat více 3"
    ],
    "less": [
      "Činnost nebo situace, která opakovaně vysávala nebo brzdila — co dělat méně 1",
      "Co dělat méně 2",
      "Co dělat méně 3"
    ]
  },
  "biggestValueZones": [
    {
      "zone": "Název oblasti — max. 3 oblasti celkem",
      "evidence": "Konkrétní důkaz z rozhovoru, na kterém tato oblast stojí."
    }
  ],
  "unknowns": [
    "Co zatím nemáme dost podložené 1 — formulace: Na základě současných dat zatím nemůžeme zodpovědně tvrdit...",
    "Co zatím nevíme 2"
  ],
  "experiments": [
    "Malý experiment 1 — konkrétní, ověřitelný v praxi, ne rada ani doporučení",
    "Experiment 2",
    "Experiment 3"
  ],
  "strengthVsRisk": [
    {
      "strength": "Název hlavního vzorce nebo silné stránky",
      "helpsWhen": "V jakých situacích tato síla vytváří hodnotu.",
      "risksWhen": "Kdy může být přehnaná nebo kontraproduktivní.",
      "peakValue": "Konkrétní podmínky nebo kontext, kde vytváří největší hodnotu.",
      "watchOut": "Situace, kde tato síla může spíše ubírat než přidávat."
    }
  ],
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

    // Získej email a jméno klientky pro odeslání reportu
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('client_name, client_email')
      .eq('id', sessionId)
      .single()

    if (sessionData?.client_email) {
      const clientName = sessionData.client_name || ''
      const vocName = clientName ? toVocative(clientName) : ''
      const greeting = vocName ? `Ahoj ${vocName},` : 'Ahoj,'
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mapa.inspiraise.com'
      const reportUrl = `${appUrl}/report?session=${sessionId}`

      const strengths = (reportData.coreStrengths || []).slice(0, 3)
      const valueZone = (reportData.valueZone || []).slice(0, 2)
      const nextSteps = (reportData.nextSteps || []).slice(0, 3)

      await resend.emails.send({
        from: 'Lenka z Inspiraise <diagnostika@inspiraise.com>',
        to: sessionData.client_email,
        subject: 'Tvoje Osobní mapa hodnoty je tady ✨',
        html: `
<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f5f3;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f5f3;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Header -->
      <tr><td style="background-color:#58113c;border-radius:14px 14px 0 0;padding:32px 40px;text-align:center;">
        <p style="margin:0 0 10px;color:#e4bdd1;font-size:13px;letter-spacing:4px;text-transform:uppercase;font-family:sans-serif;font-weight:600;">Inspiraise</p>
        <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:normal;line-height:1.4;">Osobní mapa hodnoty</h1>
      </td></tr>

      <!-- Body -->
      <tr><td style="background-color:#ffffff;padding:40px;border-radius:0 0 14px 14px;">
        <p style="margin:0 0 20px;color:#58113c;font-size:16px;line-height:1.7;">${greeting}</p>
        <p style="margin:0 0 28px;color:#58113c;font-size:16px;line-height:1.7;">
          tvoje <strong>Osobní mapa hodnoty</strong> je hotová. Níže najdeš klíčové výsledky — ulož si je, vrať se k nim, až budeš přemýšlet o dalším směru.
        </p>

        <!-- Hero Insight -->
        ${reportData.heroInsight ? `
        <div style="background-color:#f8f5f3;border-left:4px solid #f1905c;border-radius:0 10px 10px 0;padding:16px 20px;margin:0 0 28px;">
          <p style="margin:0;color:#58113c;font-size:15px;line-height:1.7;font-style:italic;">"${reportData.heroInsight}"</p>
        </div>` : ''}

        <!-- Silná jádra -->
        ${strengths.length > 0 ? `
        <h2 style="margin:0 0 16px;color:#58113c;font-size:17px;font-family:sans-serif;font-weight:700;">Tvoje silná jádra</h2>
        ${strengths.map((s: {title: string; description: string; whyItMatters: string}) => `
        <div style="margin:0 0 16px;padding:16px 20px;background-color:#f8f5f3;border-radius:10px;">
          <p style="margin:0 0 6px;color:#8d175e;font-size:14px;font-weight:700;font-family:sans-serif;">${s.title}</p>
          <p style="margin:0 0 6px;color:#58113c;font-size:14px;line-height:1.6;">${s.description}</p>
          <p style="margin:0;color:#58113c80;font-size:13px;font-style:italic;">${s.whyItMatters}</p>
        </div>`).join('')}` : ''}

        <!-- Zóna hodnoty -->
        ${valueZone.length > 0 ? `
        <h2 style="margin:28px 0 16px;color:#58113c;font-size:17px;font-family:sans-serif;font-weight:700;">Tvoje zóna hodnoty</h2>
        ${valueZone.map((v: {archetype: string; description: string}) => `
        <div style="margin:0 0 12px;padding:14px 20px;border:1.5px solid #e4bdd1;border-radius:10px;">
          <p style="margin:0 0 4px;color:#8d175e;font-size:14px;font-weight:700;font-family:sans-serif;">${v.archetype}</p>
          <p style="margin:0;color:#58113c;font-size:14px;line-height:1.6;">${v.description}</p>
        </div>`).join('')}` : ''}

        <!-- Další kroky -->
        ${nextSteps.length > 0 ? `
        <h2 style="margin:28px 0 16px;color:#58113c;font-size:17px;font-family:sans-serif;font-weight:700;">Další kroky</h2>
        <ol style="margin:0 0 28px;padding-left:20px;color:#58113c;font-size:15px;line-height:1.8;">
          ${nextSteps.map((s: string) => `<li style="margin-bottom:8px;">${s}</li>`).join('')}
        </ol>` : ''}

        <!-- Závěr -->
        <div style="background-color:#58113c;border-radius:10px;padding:20px 24px;margin:0 0 28px;">
          <p style="margin:0;color:#ffffff;font-size:15px;line-height:1.7;font-style:italic;">${reportData.closingMirror || ''}</p>
        </div>

        <!-- Tlačítko pro plný report -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:8px 0 24px;">
              <a href="${reportUrl}"
                 style="background-color:#8d175e;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;font-family:sans-serif;display:inline-block;">
                Zobrazit celý report →
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 24px;color:#58113c80;font-size:13px;line-height:1.6;font-family:sans-serif;text-align:center;">
          💡 Na stránce reportu najdeš také tlačítko "Stáhnout jako PDF".
        </p>

        <p style="margin:28px 0 0;color:#58113c;font-size:16px;line-height:1.7;">
          Užij si to, co jsi objevila,<br/>
          <strong>Lenka z Inspiraise</strong>
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:24px 0 0;text-align:center;">
        <p style="margin:0;color:#58113c60;font-size:12px;font-family:sans-serif;">
          Inspiraise s.r.o. · <a href="https://inspiraise.com" style="color:#8d175e;text-decoration:none;">inspiraise.com</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`,
      }).catch(err => console.error('Report email error:', err))
    }

    return NextResponse.json({ report: reportData })
  } catch (err) {
    console.error('Generate report error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

// Vercel Pro: dej funkci dost času na vygenerování reportu i z dlouhých rozhovorů.
// POZOR: hodnota > 60 vyžaduje plán Pro; na Hobby plánu by build selhal.
export const maxDuration = 300

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const REPORT_SYSTEM_PROMPT = `Jsi expert na analýzu hodnotových diagnostik. Na základě přiložené konverzace z diagnostiky vygeneruj strukturovaný osobní report — Mapu hodnoty.

Klíčové zásady:
- Každý závěr musí být opřený o konkrétní odpovědi z konverzace.
- Nikdy nevymýšlej insighty, které z odpovědí nevyplývají.
- Používej konkrétní formulace z odpovědí klientky.
- ČEŠTINA: Piš výhradně spisovnou, přirozenou češtinou se správným tvaroslovím, slovosledem a významem. Vyhni se nesmyslným nebo doslovně přeloženým obratům a podivným idiomům (např. NE „volali přes hlavu nákupčích" — správně třeba „volali rovnou tobě a obcházeli nákupčí"). Každá věta musí znít, jako by ji napsal rodilý mluvčí. Raději jednoduchá a jasná věta než krkolomná metafora.
- Piš v ženském rodě, osobně a přesně.
- DRUHÁ OSOBA — POVINNÉ: Oslovuj klientku přímo, ve 2. osobě („ty vidíš", „tvoje silná stránka", „umíš"). NIKDY o ní nepiš ve 3. osobě jejím jménem (ŠPATNĚ: „Bára vidí…", „Petra umí…"). Jméno použij jen ve vokativu jako oslovení (např. „Báro, …"), ne jako podmět.
- ŽÁDNÉ POMLČKY — POVINNÉ: Nikdy nepoužívej dlouhou pomlčku (—) ani střední pomlčku (–). Místo nich piš čárku, tečku nebo větu rozděl. Krátký spojovník používej jen ve složených slovech (např. „česko-slovenský"). Ideálně se obejdi bez pomlček úplně.
- STRUČNOST A ÚDERNOST: Buď konkrétní a úsporná. Každá sekce jen to podstatné, žádná vata. Report má být silný a čtivý, ne vyčerpávající. Drž celkový rozsah přiměřený, ať se dá přečíst na jeden zátah.
- TÓN: Úvod reportu (heroInsight, clientSummary, shortMirror) piš oceňujícím, ale věcným tónem — žádné mazání medu kolem huby, žádná vata. Cílem není nadchnout superlativy, ale přesně pojmenovat reálnou silnou stránku tak, aby si klientka řekla „jo, tohle jsem přesně já". Vyhni se prázdným frázím typu „vzácná schopnost", „unikátní dar", „výjimečný talent" — používej je jen tehdy, když z rozhovoru opravdu vyplývá, že jde o něco, co se běžně nevidí. Analytické sekce (slepá místa, vnitřní napětí, síla × riziko) drž věcné a přesné.
- VEĎ SILNOU STRÁNKOU: Report vždy otevírá tím nejlepším — nejdřív konkrétně pojmenuj, v čem je klientka silná a jak se to dá využít, a rozviň to. Kritičtější vhled (na co si dát pozor, rizika, slepá místa) přichází až po tomto základu, nikdy ne jako první dojem.
- Pokud znáš jméno klientky, skloňuj ho vždy do vokativu (5. pád): Lenka → Lenko, Jana → Jano, Petra → Petro, Markéta → Markéto.
- Report musí působit jako hluboké osobní zrcadlo, ne jako AI generátor osobnosti.

KONCENTROVANÝ REPORT, ŽÁDNÉ OPAKOVÁNÍ (POVINNÉ):
Report má být krátký a hutný (cca polovina dřívější délky). Každou silnou stránku, vzorec a oblast hodnoty pojmenuj a popiš POUZE JEDNOU, a to v sekci coreStrengths. NIKDY tutéž věc nepřejmenovávej jinými slovy (ne archetyp + zóna + vzorec + síla, když je to pořád totéž). Ostatní sekce na silné stránky jen krátce navazují JINÝM úhlem (energie, riziko, směr nabídky) a NESMÍ znovu vypisovat tytéž příběhy ani je znovu popisovat. Když nemáš nový úhel, sekci klidně zkrať.

Odpověz POUZE validním JSON objektem (bez markdown bloků, bez dalšího textu) v tomto přesném formátu:

{
  "heroInsight": "JEDNA věta do citace na začátku (oranžový pruh). Pojmenuj konkrétní silnou stránku / zónu génia, na které klientka může stavět. Ať si řekne: jo, tohle jsem přesně já. Konkrétní, věcná, bez vaty a prázdných superlativů.",
  "clientSummary": "2–3 věcné věty rozvíjející hlavní silnou stránku z citace. Opřené o rozhovor, oceňující ale střízlivé.",
  "coreStrengths": [
    {
      "title": "Název silné stránky",
      "description": "Co to znamená v praxi, 2 věty. Tady je JEDINÉ místo, kde silnou stránku popisuješ.",
      "evidence": ["1 konkrétní situace z rozhovoru", "max 2 důkazy"],
      "whyItMatters": "Proč je to hodnota pro druhé, 1 věta.",
      "score": 9
    }
  ],
  "energyMap": {
    "energizes": ["Kde ožívá 1", "Kde ožívá 2", "Kde ožívá 3"],
    "drains": ["Co ji vysává 1", "Co ji vysává 2", "Co ji vysává 3"]
  },
  "blindSpots": [
    {
      "selfStatement": "Co o sobě říká, její konkrétní věta",
      "truth": "Přesnější přerámování"
    }
  ],
  "strengthVsRisk": [
    {
      "strength": "Odkaz na silnou stránku JMÉNEM (neopisuj ji znovu)",
      "helpsWhen": "Kdy tato síla vytváří hodnotu, 1 věta.",
      "risksWhen": "Kdy může být přehnaná nebo kontraproduktivní, 1 věta.",
      "watchOut": "Na co si dát pozor, 1 věta."
    }
  ],
  "moreLess": {
    "more": ["Co dělat více 1", "Co dělat více 2", "Co dělat více 3"],
    "less": ["Co dělat méně 1", "Co dělat méně 2", "Co dělat méně 3"]
  },
  "directions": [
    {
      "name": "Název možného směru nabídky",
      "forWhom": "Pro koho a v jaké situaci, krátce",
      "why": "Proč to sedí na její hodnotu, 1 věta."
    }
  ],
  "firstSteps": ["Konkrétní první krok 1", "První krok 2", "První krok 3"],
  "closingMirror": "Závěrečné zrcadlo, 3–5 silných vět, které uzavírají diagnostiku a dávají pocit: Jo, tohle dává smysl."
}

POČTY (drž se kvůli stručnosti): coreStrengths max 3, blindSpots max 2, strengthVsRisk max 2, directions max 3, firstSteps max 3.`

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
      max_tokens: 4000,
      system: [{ type: 'text', text: REPORT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral', ttl: '1h' } }],
      messages: [
        {
          role: 'user',
          content: `Zde je průběh diagnostiky Hodnotového zrcadla:\n\n${conversationText}\n\nVygeneruj kompletní Mapu hodnoty jako JSON podle zadané struktury.`,
        },
      ],
    })

    const rawTextRaw = response.content[0].type === 'text' ? response.content[0].text : '{}'
    // Pojistka: odstraň dlouhé/střední pomlčky z celého výstupu (nahraď čárkou)
    const rawText = rawTextRaw.replace(/\s*[—–]\s*/g, ', ')

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
      .select('client_name, client_email, token_id')
      .eq('id', sessionId)
      .single()

    // Report je hotový → ukonči přístup (spálí token) a zastav připomínky
    if (sessionData?.token_id) {
      await supabase
        .from('tokens')
        .update({ used: true })
        .eq('id', sessionData.token_id)
    }

    if (sessionData?.client_email) {
      const clientName = sessionData.client_name || ''
      const vocName = clientName ? toVocative(clientName) : ''
      const greeting = vocName ? `Ahoj ${vocName},` : 'Ahoj,'
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mapa.inspiraise.com'
      const reportUrl = `${appUrl}/report?session=${sessionId}`

      const strengths = (reportData.coreStrengths || []).slice(0, 3)
      const firstSteps = (reportData.firstSteps || []).slice(0, 3)

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

        <!-- První kroky -->
        ${firstSteps.length > 0 ? `
        <h2 style="margin:28px 0 16px;color:#58113c;font-size:17px;font-family:sans-serif;font-weight:700;">První kroky</h2>
        <ol style="margin:0 0 28px;padding-left:20px;color:#58113c;font-size:15px;line-height:1.8;">
          ${firstSteps.map((s: string) => `<li style="margin-bottom:8px;">${s}</li>`).join('')}
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

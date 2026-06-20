import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// České vokativy
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

// Přidej kontakt do Ecomailu (volitelné — aktivuje se až po nastavení API klíče)
async function addToEcomail(email: string, firstName: string, lastName: string) {
  const apiKey = process.env.ECOMAIL_API_KEY
  const listId = process.env.ECOMAIL_LIST_ID
  if (!apiKey || !listId) return // Ecomail není nastaven — přeskočíme

  try {
    await fetch(`https://api2.ecomail.app/rest/subscriber-list/${listId}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'key': apiKey,
      },
      body: JSON.stringify({
        subscriber_data: {
          email,
          name: firstName,
          surname: lastName,
          tags: ['hodnotove-zrcadlo', 'start'],
        },
        trigger_autoresponders: true,
        update_existing: true,
      }),
    })
  } catch (err) {
    console.error('Ecomail sync error:', err)
    // Nechceme selhat kvůli Ecomailu — jen zalogujeme
  }
}

export async function POST(req: NextRequest) {
  try {
    // --- Ověření FAPI webhook secret ---
    const secret = process.env.FAPI_WEBHOOK_SECRET
    if (secret) {
      const headerSecret = req.headers.get('x-fapi-secret') || req.headers.get('x-webhook-secret')
      if (headerSecret !== secret) {
        console.warn('FAPI webhook: neplatný secret')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // FAPI posílá jen ID notifikaci — stáhneme plná data z FAPI API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      body = await req.json()
    } else {
      const text = await req.text()
      const params = new URLSearchParams(text)
      body = Object.fromEntries(params.entries())
    }
    const invoiceId = body.id
    console.log('FAPI webhook přijat, invoice ID:', invoiceId)

    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoice ID' }, { status: 400 })
    }

    // --- Stáhni plná data faktury z FAPI API ---
    const fapiUsername = process.env.FAPI_API_USERNAME
    const fapiApiKey = process.env.FAPI_API_KEY
    if (!fapiUsername || !fapiApiKey) {
      console.error('Chybí FAPI_API_USERNAME nebo FAPI_API_KEY')
      return NextResponse.json({ error: 'FAPI credentials missing' }, { status: 500 })
    }

    const credentials = Buffer.from(`${fapiUsername}:${fapiApiKey}`).toString('base64')
    const fapiRes = await fetch(`https://api.fapi.cz/invoices/${invoiceId}`, {
      headers: { 'Authorization': `Basic ${credentials}`, 'Accept': 'application/json' }
    })

    if (!fapiRes.ok) {
      console.error('FAPI API chyba:', fapiRes.status)
      return NextResponse.json({ error: 'FAPI API error' }, { status: 500 })
    }

    const invoice = await fapiRes.json()
    console.log('FAPI faktura načtena, paid:', invoice.paid, 'email:', invoice.customer?.email)

    // --- Zkontroluj zda je zaplaceno ---
    if (!invoice.paid) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'not_paid' })
    }

    // --- Zkontroluj zda obsahuje Hodnotové zrcadlo (kód 653924) ---
    const items: any[] = invoice.items || []
    const hasHodnotoveZrcadlo = items.some((item: any) => String(item.code) === '653924')

    if (!hasHodnotoveZrcadlo) {
      console.log('FAPI webhook: objednávka neobsahuje Hodnotové zrcadlo, přeskakuji')
      return NextResponse.json({ ok: true, skipped: true, reason: 'different_product' })
    }

    // --- Zákaznická data ---
    const email: string = invoice.customer?.email || ''
    const firstName: string = invoice.customer?.first_name || ''
    const lastName: string = invoice.customer?.last_name || ''
    const clientName = [firstName, lastName].filter(Boolean).join(' ').trim() || email

    if (!email || !email.includes('@')) {
      console.error('FAPI webhook: chybí email', body)
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    // --- Generuj token ---
    const supabase = createClient()
    const { data, error } = await supabase.rpc('generate_client_token', {
      client_email: email,
    })

    if (error || !data) {
      console.error('Token generation error:', error)
      return NextResponse.json({ error: 'Token generation failed' }, { status: 500 })
    }

    const token = data as string
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mapa.inspiraise.com'
    const accessUrl = `${appUrl}/start?token=${token}`
    const vocativeName = clientName ? toVocative(clientName) : ''

    // --- Odešli přístupový email ---
    await resend.emails.send({
      from: 'Lenka z Inspiraise <diagnostika@inspiraise.com>',
      to: email,
      subject: 'Tvůj přístup k Osobní mapě hodnoty ✨',
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
        <p style="margin:0 0 20px;color:#58113c;font-size:16px;line-height:1.7;">
          Ahoj ${vocativeName || 'a vítej'},
        </p>
        <p style="margin:0 0 20px;color:#58113c;font-size:16px;line-height:1.7;">
          děkuji za nákup! Připravila jsem pro tebe <strong>unikátní přístup k Osobní mapě hodnoty</strong> —
          hloubkové diagnostice, která odhalí, co umíš tak přirozeně,
          že jsi to přestala vnímat jako hodnotu.
        </p>
        <p style="margin:0 0 20px;color:#58113c;font-size:16px;line-height:1.7;">
          Celý proces trvá <strong>45–60 minut</strong>. Připrav si klidné místo
          a ideálně i aplikaci, která přepisuje řeč na text —
          mluveným slovem to půjde plynuleji. Já využívám
          <strong>Wispr Flow</strong>. Když ji budeš chtít vyzkoušet,
          použij <a href="https://wisprflow.ai/r?LENKA74" style="color:#8d175e;">tento odkaz</a>
          a můžeš appku nezávazně testovat 30 dní v plné verzi zdarma.
        </p>

        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:12px 0 36px;">
              <a href="${accessUrl}"
                 style="background-color:#8d175e;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:600;font-family:sans-serif;display:inline-block;line-height:1;">
                &#8594;&nbsp;&nbsp;Začít diagnostiku
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 8px;color:#58113c80;font-size:13px;line-height:1.6;font-family:sans-serif;">
          Nebo zkopíruj tento odkaz do prohlížeče:
        </p>
        <p style="margin:0 0 32px;background-color:#f8f5f3;border-radius:8px;padding:12px 16px;font-size:12px;color:#58113c;word-break:break-all;font-family:monospace;">
          ${accessUrl}
        </p>

        <p style="margin:0 0 28px;color:#58113c80;font-size:13px;line-height:1.6;font-family:sans-serif;">
          💡 <strong>Nemusíš to stihnout napoprvé.</strong> Přes tento odkaz se můžeš kdykoliv vrátit a pokračovat přesně tam, kde jsi skončil(a) — platí, dokud diagnostiku nedokončíš a nevznikne tvoje mapa hodnoty. Odkaz je určený jen pro tebe.
          Kdyby cokoliv nefungovalo, napiš mi na
          <a href="mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'lenka.pechrova@inspiraise.com'}" style="color:#8d175e;">${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'lenka.pechrova@inspiraise.com'}</a>.
        </p>

        <p style="margin:0;color:#58113c;font-size:16px;line-height:1.7;">
          Užij si objevování své zóny génia a těším se na zpětnou vazbu!<br/>
          <strong>Lenka z Inspiraise</strong>
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:24px 0 0;text-align:center;">
        <p style="margin:0;color:#58113c60;font-size:12px;font-family:sans-serif;">
          Inspiraise s.r.o. ·
          <a href="https://inspiraise.com" style="color:#8d175e;text-decoration:none;">inspiraise.com</a>
          · <a href="https://inspiraise.com/gdpr/" style="color:#8d175e;text-decoration:none;">Ochrana osobních údajů</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`,
    })

    // --- Přidej do Ecomailu (pokud je nastaven) ---
    await addToEcomail(email, firstName, lastName)

    // --- Konzultace: pošli email s rezervačním odkazem ---
    const hasKonzultace = items.some((item: any) => String(item.code) === '653939')
    const konzultaceUrl = process.env.FAPI_KONZULTACE_URL || 'https://scheduler.zoom.us/lenka-pechrov'

    if (hasKonzultace) {
      await resend.emails.send({
        from: 'Lenka z Inspiraise <diagnostika@inspiraise.com>',
        to: email,
        subject: 'Rezervuj si termín konzultace 🗓',
        html: `
<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f5f3;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f5f3;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background-color:#58113c;border-radius:14px 14px 0 0;padding:32px 40px;text-align:center;">
        <p style="margin:0 0 10px;color:#e4bdd1;font-size:13px;letter-spacing:4px;text-transform:uppercase;font-family:sans-serif;font-weight:600;">Inspiraise</p>
        <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:normal;line-height:1.4;">Z hodnoty do praxe · 1:1 konzultace</h1>
      </td></tr>
      <tr><td style="background-color:#ffffff;padding:40px;border-radius:0 0 14px 14px;">
        <p style="margin:0 0 20px;color:#58113c;font-size:16px;line-height:1.7;">
          Ahoj ${vocativeName || firstName || ''},
        </p>
        <p style="margin:0 0 20px;color:#58113c;font-size:16px;line-height:1.7;">
          skvělá volba! Až dokončíš svoji Osobní mapu hodnoty, rezervuj si termín naší 1:1 konzultace.
          Projdeme ji společně a převedeme výstupy do konkrétních kroků pro tvoji situaci.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding:12px 0 36px;">
            <a href="${konzultaceUrl}"
               style="background-color:#8d175e;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:600;font-family:sans-serif;display:inline-block;line-height:1;">
              &#8594;&nbsp;&nbsp;Rezervovat termín konzultace
            </a>
          </td></tr>
        </table>
        <p style="margin:0;color:#58113c;font-size:16px;line-height:1.7;">
          Těším se na setkání!<br/>
          <strong>Lenka z Inspiraise</strong>
        </p>
      </td></tr>
      <tr><td style="padding:24px 0 0;text-align:center;">
        <p style="margin:0;color:#58113c60;font-size:12px;font-family:sans-serif;">
          Inspiraise s.r.o. ·
          <a href="https://inspiraise.com" style="color:#8d175e;text-decoration:none;">inspiraise.com</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`,
      })
      console.log(`Konzultace email odeslán pro ${email}`)
    }

    console.log(`FAPI webhook: token vygenerován pro ${email}`)
    return NextResponse.json({ ok: true, email })

  } catch (err) {
    console.error('FAPI webhook error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

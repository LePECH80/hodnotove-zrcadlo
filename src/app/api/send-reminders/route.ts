import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Po kolika dnech od zakoupení poslat 1./2./3. připomínku
const REMINDER_DAYS = [1, 3, 7]
const MAX_REMINDERS = REMINDER_DAYS.length

function toVocative(fullName: string): string {
  const first = fullName.trim().split(' ')[0]
  if (!first) return ''
  const name = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
  if (name.endsWith('a') || name.endsWith('á')) return name.slice(0, -1) + 'o'
  if (name.endsWith('el') || name.endsWith('il')) return name + 'i'
  if (name.endsWith('r')) return name + 'e'
  if (name.endsWith('n')) return name + 'e'
  if (name.endsWith('k')) return name.slice(0, -1) + 'ku'
  return name
}

function reminderEmail(vocativeName: string, accessUrl: string, contactEmail: string): string {
  const greeting = vocativeName ? `Ahoj ${vocativeName},` : 'Ahoj,'
  return `
<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f5f3;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f5f3;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background-color:#58113c;border-radius:14px 14px 0 0;padding:32px 40px;text-align:center;">
        <p style="margin:0 0 10px;color:#e4bdd1;font-size:13px;letter-spacing:4px;text-transform:uppercase;font-family:sans-serif;font-weight:600;">Inspiraise</p>
        <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:normal;line-height:1.4;">Tvoje mapa hodnoty na tebe čeká</h1>
      </td></tr>
      <tr><td style="background-color:#ffffff;padding:40px;border-radius:0 0 14px 14px;">
        <p style="margin:0 0 20px;color:#58113c;font-size:16px;line-height:1.7;">${greeting}</p>
        <p style="margin:0 0 20px;color:#58113c;font-size:16px;line-height:1.7;">
          všimla jsem si, že jsi svoji <strong>Osobní mapu hodnoty</strong> ještě nedokončila.
          Nic se neděje — tvůj přístup pořád platí a můžeš pokračovat přesně tam, kde jsi přestala.
        </p>
        <p style="margin:0 0 20px;color:#58113c;font-size:16px;line-height:1.7;">
          Stačí 45–60 minut v klidu. Na konci dostaneš report, ke kterému se budeš moct vracet.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding:12px 0 36px;">
            <a href="${accessUrl}"
               style="background-color:#8d175e;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:600;font-family:sans-serif;display:inline-block;line-height:1;">
              &#8594;&nbsp;&nbsp;Pokračovat v diagnostice
            </a>
          </td></tr>
        </table>
        <p style="margin:0 0 8px;color:#58113c80;font-size:13px;line-height:1.6;font-family:sans-serif;">
          Nebo zkopíruj tento odkaz do prohlížeče:
        </p>
        <p style="margin:0 0 28px;background-color:#f8f5f3;border-radius:8px;padding:12px 16px;font-size:12px;color:#58113c;word-break:break-all;font-family:monospace;">
          ${accessUrl}
        </p>
        <p style="margin:0;color:#58113c;font-size:16px;line-height:1.7;">
          Kdyby cokoliv, napiš mi na
          <a href="mailto:${contactEmail}" style="color:#8d175e;">${contactEmail}</a>.<br/>
          <strong>Lenka z Inspiraise</strong>
        </p>
      </td></tr>
      <tr><td style="padding:24px 0 0;text-align:center;">
        <p style="margin:0;color:#58113c60;font-size:12px;font-family:sans-serif;">
          Inspiraise s.r.o. · <a href="https://inspiraise.com" style="color:#8d175e;text-decoration:none;">inspiraise.com</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

export async function GET(req: NextRequest) {
  // --- Ověření, že volá Vercel cron (nebo oprávněný správce) ---
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mapa.inspiraise.com'
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'lenka.pechrova@inspiraise.com'
  const devToken = process.env.DEV_TOKEN

  // Nedokončené přístupy (report ještě nevznikl), které ještě mají nárok na připomínku
  const { data: tokens, error } = await supabase
    .from('tokens')
    .select('id, token, email, created_at, reminders_sent')
    .eq('used', false)
    .lt('reminders_sent', MAX_REMINDERS)

  if (error) {
    console.error('send-reminders: DB error', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const now = Date.now()
  let sent = 0
  const results: string[] = []

  for (const t of tokens ?? []) {
    // Přeskoč dev/testovací token a záznamy bez emailu
    if (devToken && t.token === devToken) continue
    if (!t.email || !t.email.includes('@') || t.email === 'test@test.cz') continue

    const daysSince = (now - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24)
    const dueThreshold = REMINDER_DAYS[t.reminders_sent] // další připomínka, která je na řadě

    if (daysSince < dueThreshold) continue // ještě není čas

    // Zjisti jméno pro oslovení (z posledního sezení)
    let vocativeName = ''
    const { data: sess } = await supabase
      .from('sessions')
      .select('client_name')
      .eq('token_id', t.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (sess?.client_name) vocativeName = toVocative(sess.client_name)

    const accessUrl = `${appUrl}/start?token=${t.token}`

    try {
      await resend.emails.send({
        from: 'Lenka z Inspiraise <diagnostika@inspiraise.com>',
        to: t.email,
        subject: 'Tvoje Osobní mapa hodnoty na tebe čeká ✨',
        html: reminderEmail(vocativeName, accessUrl, contactEmail),
      })

      await supabase
        .from('tokens')
        .update({ reminders_sent: t.reminders_sent + 1, last_reminder_at: new Date().toISOString() })
        .eq('id', t.id)

      sent++
      results.push(`${t.email} (připomínka #${t.reminders_sent + 1})`)
    } catch (err) {
      console.error('send-reminders: email error pro', t.email, err)
    }
  }

  console.log(`send-reminders: odesláno ${sent} připomínek`)
  return NextResponse.json({ ok: true, sent, results })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { adminPassword, clientName, clientEmail } = await req.json()

    // Ověření hesla
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: 'Nesprávné heslo' }, { status: 401 })
    }

    if (!clientName?.trim() || !clientEmail?.trim()) {
      return NextResponse.json({ success: false, error: 'Chybí jméno nebo email' }, { status: 400 })
    }

    const supabase = createClient()

    // Vygeneruj token přes Supabase funkci
    const { data, error } = await supabase
      .rpc('generate_client_token', { client_email: clientEmail.trim() })

    if (error || !data) {
      console.error('Token generation error:', error)
      return NextResponse.json({ success: false, error: 'Nepodařilo se vygenerovat token' }, { status: 500 })
    }

    const token = data as string
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hodnotove-zrcadlo.vercel.app'
    const accessUrl = `${appUrl}/start?token=${token}`

    // Odešli email přes Resend
    const { error: emailError } = await resend.emails.send({
      from: 'Lenka z inspiraise <diagnostika@inspiraise.com>',
      to: clientEmail.trim(),
      subject: 'Tvůj přístup k Osobní mapě hodnoty ✨',
      html: `
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8f5f3;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f5f3;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#58113c;border-radius:14px 14px 0 0;padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#e4bdd1;font-size:13px;letter-spacing:3px;text-transform:uppercase;font-family:sans-serif;">inspiraise</p>
              <h1 style="margin:12px 0 0;color:#ffffff;font-size:22px;font-weight:normal;line-height:1.4;">Osobní mapa hodnoty</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;border-radius:0 0 14px 14px;">
              <p style="margin:0 0 20px;color:#58113c;font-size:16px;line-height:1.7;">
                Ahoj ${clientName.trim()},
              </p>
              <p style="margin:0 0 20px;color:#58113c;font-size:16px;line-height:1.7;">
                připravila jsem pro tebe přístup k <strong>Osobní mapě hodnoty</strong> —
                hloubkové diagnostice, která odhalí, co umíš tak přirozeně,
                že jsi to přestala vnímat jako hodnotu.
              </p>
              <p style="margin:0 0 32px;color:#58113c;font-size:16px;line-height:1.7;">
                Celý proces trvá <strong>45–60 minut</strong>. Připrav si klidné místo
                a ideálně i mikrofon — mluveným slovem to půjde plynuleji.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${accessUrl}"
                       style="background:linear-gradient(135deg,#58113c,#8d175e);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:600;font-family:sans-serif;display:inline-block;">
                      Začít diagnostiku →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#58113c99;font-size:13px;line-height:1.6;font-family:sans-serif;">
                Nebo zkopíruj tento odkaz do prohlížeče:
              </p>
              <p style="margin:0 0 32px;background-color:#f8f5f3;border-radius:8px;padding:12px 16px;font-size:13px;color:#58113c;word-break:break-all;font-family:monospace;">
                ${accessUrl}
              </p>

              <p style="margin:0 0 4px;color:#58113c99;font-size:13px;line-height:1.6;font-family:sans-serif;">
                ⚠️ Odkaz je <strong>jednorázový</strong> a platný pouze pro tebe.
                Pokud by přestal fungovat, napiš mi.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0;color:#58113c80;font-size:12px;font-family:sans-serif;">
                Lenka Pechrová · inspiraise ·
                <a href="https://lenkapechrova.cz" style="color:#8d175e;">lenkapechrova.cz</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    })

    if (emailError) {
      console.error('Email error:', emailError)
      // Token byl vytvořen, jen email selhal — vrátíme URL alespoň pro ruční zaslání
      return NextResponse.json({
        success: true,
        emailSent: false,
        accessUrl,
        warning: 'Token byl vytvořen, ale email se nepodařilo odeslat.',
      })
    }

    return NextResponse.json({ success: true, emailSent: true, accessUrl })

  } catch (err) {
    console.error('Admin generate token error:', err)
    return NextResponse.json({ success: false, error: 'Interní chyba serveru' }, { status: 500 })
  }
}

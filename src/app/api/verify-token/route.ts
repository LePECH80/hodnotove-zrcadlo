import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ valid: false }, { status: 400 })
    }

    const supabase = createClient()

    // Dev/testovací bypass — vždy nové sezení, token se nikdy nespálí
    const devToken = process.env.DEV_TOKEN
    if (devToken && token === devToken) {
      let { data: devRow } = await supabase
        .from('tokens')
        .select('id')
        .eq('token', devToken)
        .single()

      if (!devRow) {
        const { data: newRow } = await supabase
          .from('tokens')
          .insert({ token: devToken, email: 'test@test.cz', used: false })
          .select('id')
          .single()
        devRow = newRow
      }

      if (devRow) {
        const { data: session } = await supabase
          .from('sessions')
          .insert({ token_id: devRow.id, messages: [], current_phase: 1 })
          .select('id')
          .single()
        if (session) {
          return NextResponse.json({ valid: true, sessionId: session.id, email: 'test@test.cz', resumed: false })
        }
      }
    }

    // Najdi token
    const { data: tokenRow, error } = await supabase
      .from('tokens')
      .select('id, used, email')
      .eq('token', token)
      .single()

    if (error || !tokenRow) {
      return NextResponse.json({ valid: false })
    }

    // used = true znamená, že report už byl vygenerován → přístup skončil
    if (tokenRow.used) {
      return NextResponse.json({ valid: false, reason: 'completed' })
    }

    // --- Přístup je platný. Token se NESPÁLÍ. ---
    // Pokud už existuje rozdělané sezení, navážeme na něj. Jinak vytvoříme nové.
    const { data: existing } = await supabase
      .from('sessions')
      .select('id, messages')
      .eq('token_id', tokenRow.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      const msgCount = Array.isArray(existing.messages) ? existing.messages.length : 0
      return NextResponse.json({
        valid: true,
        sessionId: existing.id,
        email: tokenRow.email,
        resumed: msgCount > 0,
      })
    }

    // Žádné sezení zatím není — vytvoř nové
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({ token_id: tokenRow.id, messages: [], current_phase: 1 })
      .select('id')
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ valid: false })
    }

    return NextResponse.json({ valid: true, sessionId: session.id, email: tokenRow.email, resumed: false })
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}

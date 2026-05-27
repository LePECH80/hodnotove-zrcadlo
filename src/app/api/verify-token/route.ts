import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ valid: false }, { status: 400 })
    }

    const supabase = createClient()

    // Find token
    const { data: tokenRow, error } = await supabase
      .from('tokens')
      .select('id, used, email')
      .eq('token', token)
      .single()

    if (error || !tokenRow) {
      return NextResponse.json({ valid: false })
    }

    if (tokenRow.used) {
      return NextResponse.json({ valid: false, reason: 'used' })
    }

    // Mark token as used atomically
    const { error: updateError } = await supabase
      .from('tokens')
      .update({ used: true })
      .eq('id', tokenRow.id)
      .eq('used', false) // optimistic lock

    if (updateError) {
      return NextResponse.json({ valid: false, reason: 'race' })
    }

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({ token_id: tokenRow.id, messages: [], current_phase: 1 })
      .select('id')
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ valid: false })
    }

    return NextResponse.json({ valid: true, sessionId: session.id, email: tokenRow.email })
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}

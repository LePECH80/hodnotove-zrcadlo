import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { sessionId, name, email } = await req.json()

    if (!sessionId || !name || !email) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const supabase = createClient()
    await supabase
      .from('sessions')
      .update({ client_name: name, client_email: email })
      .eq('id', sessionId)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// Keep-alive: drží Supabase projekt aktivní, aby se na free tarifu neuspal
// po 7 dnech nečinnosti. Volá se plánovaně přes Vercel cron (viz vercel.json).
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Ověření, že volá Vercel cron (nebo oprávněný správce)
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const supabase = createClient()
    // Lehký dotaz do DB = aktivita, která resetuje odpočet uspání
    const { error } = await supabase.from('sessions').select('id').limit(1)
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, ts: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

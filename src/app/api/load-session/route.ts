import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('sessions')
    .select('messages, current_phase, report')
    .eq('id', sessionId)
    .single()

  if (error || !data) {
    return NextResponse.json({ messages: [], currentPhase: 1 })
  }

  return NextResponse.json({
    messages: data.messages ?? [],
    currentPhase: data.current_phase ?? 1,
    report: data.report ?? null,
    complete: data.current_phase >= 5 && (data.messages as unknown[]).length > 0,
  })
}

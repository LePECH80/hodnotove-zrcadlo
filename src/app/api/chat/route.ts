import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase'
import { SYSTEM_PROMPT } from '@/lib/systemPrompt'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Parse phase marker from AI response
function parsePhase(text: string): { clean: string; phase: number; complete: boolean } {
  const phaseMatch = text.match(/^##FÁZE:(\d)##\n?/)
  const phase = phaseMatch ? parseInt(phaseMatch[1]) : null
  const complete = text.includes('##HOTOVO##')
  const clean = text
    .replace(/^##FÁZE:\d##\n?/, '')
    .replace('##HOTOVO##', '')
    .trim()
  return { clean, phase: phase ?? 0, complete }
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, messages } = await req.json() as {
      sessionId: string
      messages: Message[]
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
    }

    const supabase = createClient()

    // Verify session exists
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, current_phase')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Call Anthropic — send full conversation history
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: messages.length > 0
        ? messages.map(m => ({ role: m.role, content: m.content }))
        : [{ role: 'user', content: 'Začínám.' }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    const { clean, phase, complete } = parsePhase(rawText)

    const newPhase = phase > 0 ? phase : session.current_phase

    // Save to Supabase
    await supabase
      .from('sessions')
      .update({
        messages: messages.length > 0
          ? [...messages, { role: 'assistant', content: clean }]
          : [{ role: 'assistant', content: clean }],
        current_phase: newPhase,
      })
      .eq('id', sessionId)

    return NextResponse.json({
      message: clean,
      phase: newPhase,
      complete,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Chat API error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

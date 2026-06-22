import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase'
import { SYSTEM_PROMPT } from '@/lib/systemPrompt'

export const maxDuration = 60

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Odstraň dlouhé/střední pomlčky (nahraď čárkou) — Lenka je nechce v textech
function stripDashes(text: string): string {
  return text.replace(/\s*[—–]\s*/g, ', ')
}

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

    // Sestav zprávy a zapni prompt caching (šetří kredity — opakovaný prompt + historie se čtou levně)
    const apiMessages: Anthropic.MessageParam[] = messages.length > 0
      ? messages.map(m => ({ role: m.role, content: m.content }))
      : [{ role: 'user', content: 'Začínám.' }]

    // Cache breakpoint na poslední zprávě → celá předchozí historie se příště čte z cache
    const lastIdx = apiMessages.length - 1
    const lastContent = apiMessages[lastIdx].content
    if (typeof lastContent === 'string') {
      apiMessages[lastIdx] = {
        role: apiMessages[lastIdx].role,
        content: [{ type: 'text', text: lastContent, cache_control: { type: 'ephemeral' } }],
      }
    }

    // Call Anthropic — systémový prompt cachovaný (posílá se každou zprávu, ale čte se levně)
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: apiMessages,
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed = parsePhase(rawText)
    const clean = stripDashes(parsed.clean)
    const { phase, complete } = parsed

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

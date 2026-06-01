import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasDevToken: !!process.env.DEV_TOKEN,
    devTokenLength: process.env.DEV_TOKEN?.length ?? 0,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
  })
}

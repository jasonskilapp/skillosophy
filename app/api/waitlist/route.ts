import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  // TODO: store in Supabase waitlist table
  console.log('[waitlist] new signup:', email)

  return NextResponse.json({ success: true })
}

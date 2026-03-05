import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')

  let query = (supabase as any)
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (type) query = query.eq('contact_type', type)
  if (status) query = query.eq('lead_status', status)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contacts: data })
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  let body: Record<string, unknown>

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 })
  }

  const { first_name, last_name, email } = body as Record<string, string>

  if (!first_name || !last_name || !email) {
    return NextResponse.json(
      { error: 'first_name, last_name, and email are required' },
      { status: 400 }
    )
  }

  const { data: contact, error } = await (supabase as any)
    .from('contacts')
    .insert([body])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contact }, { status: 201 })
}

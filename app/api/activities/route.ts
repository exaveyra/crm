import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const contactId = searchParams.get('contact_id')
  const limit = parseInt(searchParams.get('limit') || '50')

  let query = supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (contactId) query = query.eq('contact_id', contactId)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('activities')
    .insert({ ...body, created_by: user?.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update last_contacted_at on the contact
  if (body.contact_id) {
    await supabase
      .from('contacts')
      .update({ last_contacted_at: new Date().toISOString() })
      .eq('id', body.contact_id)
  }

  return NextResponse.json({ data }, { status: 201 })
}

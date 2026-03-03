import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const contactId = searchParams.get('contact_id')
  const orgId = searchParams.get('organization_id')
  const stage = searchParams.get('stage')

  let query = supabase
    .from('deals')
    .select(`
      *,
      contact:contacts(id, first_name, last_name, practice_name),
      organization:organizations(id, name)
    `)
    .order('created_at', { ascending: false })

  if (contactId) query = query.eq('contact_id', contactId)
  if (orgId) query = query.eq('organization_id', orgId)
  if (stage) query = query.eq('stage', stage)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('deals')
    .insert({ ...body, assigned_to: user?.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

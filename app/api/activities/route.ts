import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = req.nextUrl
  const contactId = searchParams.get('contact_id')
  const dealId = searchParams.get('deal_id')

  let query = (supabase as any)
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })

  if (contactId) query = query.eq('contact_id', contactId)
  if (dealId) query = query.eq('deal_id', dealId)

  const { data, error } = await query

  if (error) return NextResponse.json({ activities: [] })
  return NextResponse.json({ activities: data })
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()

  const { data, error } = await (supabase as any)
    .from('activities')
    .insert([body])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ activity: data })
}

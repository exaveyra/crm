import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/team
 * Returns all user profiles from the profiles table.
 */
export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data || [])
}

/**
 * PATCH /api/team
 * Update a team member's role or active status in the profiles table.
 */
export async function PATCH(request: NextRequest) {
  const supabase = createAdminClient()
  const body = await request.json()
  const { id, role, is_active } = body

  if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (role !== undefined) updates.role = role
  if (is_active !== undefined) updates.is_active = is_active

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

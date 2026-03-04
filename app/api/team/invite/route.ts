import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/team/invite
 * Sends a Supabase magic-link invite email to a new team member.
 * Uses the admin client (service role) to call inviteUserByEmail.
 */
export async function POST(request: NextRequest) {
  const supabase = createAdminClient()

  const { email, full_name, role, title } = await request.json()

  if (!email || !full_name) {
    return NextResponse.json(
      { error: 'Email and full name are required.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name,
      role: role || 'sales_rep',
      title: title || '',
    },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, user: data.user }, { status: 201 })
}

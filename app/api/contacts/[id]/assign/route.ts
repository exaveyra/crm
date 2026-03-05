import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient()
  const { assigned_to } = await request.json();

  const { data, error } = await (supabase as any)
    .from('contacts')
    .update({
      assigned_to: assigned_to || null,
      assigned_at: assigned_to ? new Date().toISOString() : null,
    })
    .eq('id', id)
  .select()
  .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
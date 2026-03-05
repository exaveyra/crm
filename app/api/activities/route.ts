import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("contact_id", params.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ activities: [] });
  return NextResponse.json({ activities: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("activities")
    .insert([{ ...body, contact_id: params.id }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ activity: data });
}
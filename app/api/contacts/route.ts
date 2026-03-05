import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  let query = supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (type) query = query.eq("contact_type", type);
  if (status) query = query.eq("lead_status", status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contacts: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data: contact, error } = await supabase
    .from("contacts")
    .insert([body])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contact });
}
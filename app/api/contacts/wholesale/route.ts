import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const types = searchParams.get("types")?.split(",") || [
    "prescriber", "clinic_admin", "regenerative_md", "aesthetics_md"
  ];
  const status = searchParams.get("status");

  let query = supabase
    .from("contacts")
    .select("*")
    .in("contact_type", types)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("lead_status", status);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data });
}
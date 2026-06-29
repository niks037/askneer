import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const { data } = await supabase.from("profiles").select("*").eq("email", email).single();
  return Response.json({ profile: data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { data: existing } = await supabase.from("profiles").select("id").eq("email", body.email).single();
  if (existing) {
    await supabase.from("profiles").update({ child_name: body.child_name, child_dob: body.child_dob, child_notes: body.child_notes }).eq("email", body.email);
  } else {
    await supabase.from("profiles").insert([body]);
  }
  return Response.json({ success: true });
}
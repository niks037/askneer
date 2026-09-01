import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ profile: null, children: [] }, { status: 401 });
  const email = session.user.email;

  const { searchParams } = new URL(req.url);
  const child_id = searchParams.get("child_id");

  const { data: children } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: true });

  if (!children || children.length === 0) {
    return Response.json({ profile: null, children: [] });
  }

  // If no active child exists, automatically activate the first one
  const hasActive = children.some(c => c.is_active);
  if (!hasActive) {
    await supabase
      .from("profiles")
      .update({ is_active: true })
      .eq("email", email)
      .eq("child_id", children[0].child_id);
    children[0].is_active = true;
  }

  if (child_id) {
    const child = children.find(c => c.child_id === child_id);
    return Response.json({ profile: child || children[0], children });
  }

  const active = children.find(c => c.is_active) || children[0];
  return Response.json({ profile: active, children });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ success: false }, { status: 401 });
  const email = session.user.email;

  const body = await req.json();
  const { child_name, child_dob, child_notes, child_id } = body;

  if (child_id) {
    await supabase
      .from("profiles")
      .update({ child_name, child_dob, child_notes })
      .eq("email", email)
      .eq("child_id", child_id);
  } else {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email);

    if (existing && existing.length > 0) {
      await supabase
        .from("profiles")
        .update({ is_active: false })
        .eq("email", email);
      await supabase
        .from("profiles")
        .insert([{ email, child_name, child_dob, child_notes, is_active: true }]);
    } else {
      await supabase
        .from("profiles")
        .insert([{ email, child_name, child_dob, child_notes, is_active: true }]);
    }
  }

  return Response.json({ success: true });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ success: false }, { status: 401 });
  const email = session.user.email;

  const { child_id } = await req.json();
  if (!child_id) return Response.json({ success: false });

  await supabase
    .from("profiles")
    .update({ is_active: false })
    .eq("email", email);

  await supabase
    .from("profiles")
    .update({ is_active: true })
    .eq("email", email)
    .eq("child_id", child_id);

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .eq("child_id", child_id)
    .single();

  return Response.json({ success: true, profile: data });
}
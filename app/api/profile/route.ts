import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const child_id = searchParams.get("child_id");

  if (!email) return Response.json({ profile: null, children: [] });

  // Get all children for this email
  const { data: children } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: true });

  if (!children || children.length === 0) {
    return Response.json({ profile: null, children: [] });
  }

  // If child_id specified, return that child
  if (child_id) {
    const child = children.find(c => c.child_id === child_id);
    return Response.json({ profile: child || children[0], children });
  }

  // Otherwise return active child or first child
  const active = children.find(c => c.is_active) || children[0];
  return Response.json({ profile: active, children });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { email, child_name, child_dob, child_notes, child_id } = body;

  if (!email) return Response.json({ success: false });

  if (child_id) {
    // Update existing child
    await supabase
      .from("profiles")
      .update({ child_name, child_dob, child_notes })
      .eq("email", email)
      .eq("child_id", child_id);
  } else {
    // Check if this is first child
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email);

    if (existing && existing.length > 0) {
      // Add new child — deactivate all others first
      await supabase
        .from("profiles")
        .update({ is_active: false })
        .eq("email", email);

      await supabase
        .from("profiles")
        .insert([{ email, child_name, child_dob, child_notes, is_active: true }]);
    } else {
      // First child ever
      await supabase
        .from("profiles")
        .insert([{ email, child_name, child_dob, child_notes, is_active: true }]);
    }
  }

  return Response.json({ success: true });
}

export async function PATCH(req: Request) {
  // Switch active child
  const { email, child_id } = await req.json();
  if (!email || !child_id) return Response.json({ success: false });

  // Deactivate all children
  await supabase
    .from("profiles")
    .update({ is_active: false })
    .eq("email", email);

  // Activate selected child
  await supabase
    .from("profiles")
    .update({ is_active: true })
    .eq("email", email)
    .eq("child_id", child_id);

  // Return the selected child's full profile
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .eq("child_id", child_id)
    .single();

  return Response.json({ success: true, profile: data });
}
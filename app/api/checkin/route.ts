import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;

  const { child_name, child_id, mood, sleep_quality, notes } = await req.json();

  // Check if already checked in today
  const today = new Date().toISOString().split("T")[0];
  const { data: existing } = await supabase
    .from("daily_checkins")
    .select("id")
    .eq("email", email)
    .eq("child_name", child_name)
    .eq("checkin_date", today)
    .single();

  if (existing) {
    return Response.json({ ok: true, already_done: true });
  }

  // Save check-in
  await supabase.from("daily_checkins").insert([{
    email,
    child_name,
    child_id,
    mood,
    sleep_quality,
    notes,
    checkin_date: today,
  }]);

  // Save meaningful pattern to memories
  if (notes) {
    await supabase.from("memories").insert([{
      email,
      child_name,
      memory: `Daily note (${new Date().toLocaleDateString()}): ${notes}`,
    }]);
  }

  return Response.json({ ok: true });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ checkins: [] }, { status: 401 });
  const email = session.user.email;

  const { searchParams } = new URL(req.url);
  const child_name = searchParams.get("child_name");
  const today = new Date().toISOString().split("T")[0];

  // Check if already done today
  const { data: todayCheckin } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("email", email)
    .eq("child_name", child_name || "")
    .eq("checkin_date", today)
    .single();

  // Get last 7 days
  const { data: recent } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("email", email)
    .eq("child_name", child_name || "")
    .order("checkin_date", { ascending: false })
    .limit(7);

  return Response.json({
    done_today: !!todayCheckin,
    today: todayCheckin || null,
    recent: recent || [],
  });
}
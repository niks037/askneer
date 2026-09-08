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

  // Save meaningful pattern to memories — tagged 'parent' since this is the
  // parent's own typed note, not something extracted/inferred that needs review
  if (notes) {
    await supabase.from("memories").insert([{
      email,
      child_name,
      memory: `Daily note (${new Date().toLocaleDateString()}): ${notes}`,
      source: 'parent',
      certainty: 'confirmed',
    }]);
  }

  // Rule-based pattern detection — no extra AI call, just checks recent check-ins directly.
  // A "bad day" is a low mood or low sleep-quality rating.
  const { data: recentCheckins } = await supabase
    .from("daily_checkins")
    .select("mood, sleep_quality, checkin_date")
    .eq("email", email)
    .eq("child_name", child_name)
    .order("checkin_date", { ascending: false })
    .limit(5);

  const isBadDay = (c: { mood: string; sleep_quality: number }) =>
    ["tired", "cranky", "unwell"].includes(c.mood) || (c.sleep_quality ?? 5) <= 2;

  let consecutiveBadDays = 0;
  for (const c of recentCheckins || []) {
    if (isBadDay(c)) consecutiveBadDays++;
    else break;
  }

  const patternDetected = consecutiveBadDays >= 3;
  const insight = patternDetected
    ? {
        message: `${child_name}'s mood or sleep has been low for ${consecutiveBadDays} days in a row.`,
        suggestion: "Want to check in with Sleep Coach tonight to see what might help?",
        action: "sleep_coach",
      }
    : null;

  return Response.json({ ok: true, patternDetected, insight });
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
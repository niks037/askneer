import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;

  const { child_name, child_id, bedtime, wake_time, total_hours, night_wakings, waking_duration, nap1_time, nap1_duration, nap2_time, nap2_duration, child_mood } = await req.json();

  // Get child profile for age
  const { data: profile } = await supabase
    .from("profiles")
    .select("child_dob, child_notes")
    .eq("email", email)
    .eq("is_active", true)
    .single();

  // Get existing memories
  const { data: memoriesData } = await supabase
    .from("memories")
    .select("memory")
    .eq("email", email)
    .eq("child_name", child_name)
    .limit(10);

  const memories = (memoriesData || []).map(r => r.memory);

  // Get recent sleep logs for context
  const { data: recentLogs } = await supabase
    .from("sleep_logs")
    .select("*")
    .eq("email", email)
    .eq("child_name", child_name)
    .order("created_at", { ascending: false })
    .limit(5);

  // Calculate child age
  const getAge = (dob: string) => {
    if (!dob) return "";
    const birth = new Date(dob);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months < 12) return `${months} months old`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years} years ${rem} months old` : `${years} years old`;
  };

  const childAge = profile?.child_dob ? getAge(profile.child_dob) : "unknown age";

  // Build recent sleep context
  const recentSleepContext = recentLogs && recentLogs.length > 0
    ? `\nRecent sleep history (last ${recentLogs.length} days):\n${recentLogs.map(l =>
        `- ${l.log_date}: ${l.total_hours}h total, ${l.night_wakings} wakings, mood: ${l.child_mood}`
      ).join("\n")}`
    : "";

  const memoriesContext = memories.length > 0
    ? `\nWhat you know about ${child_name}:\n${memories.map(m => `- ${m}`).join("\n")}`
    : "";

  // Generate sleep plan with Claude
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: `You are AskNeer's Sleep Coach — a warm, knowledgeable parenting sleep advisor. 
You give personalized, actionable sleep guidance based on the specific child's age, sleep patterns, and history.

IMPORTANT RULES:
- Give a specific bedtime WINDOW (e.g. 7:30–7:45 PM), never an exact time
- Always explain WHY based on the child's specific data
- Give 3 clear actionable steps for tonight
- Be warm and reassuring — sleep deprivation is exhausting
- Never diagnose sleep disorders
- Always add: "Every child is different — adjust based on what you know about your child"
- Keep response under 200 words
- No markdown, no bullet points with asterisks, use numbers for steps`,
    messages: [{
      role: "user",
      content: `Generate a personalized sleep plan for ${child_name}, ${childAge}.

Tonight's sleep data:
- Bedtime last night: ${bedtime || "not provided"}
- Wake time this morning: ${wake_time || "not provided"}  
- Total sleep: ${total_hours || "not provided"} hours
- Night wakings: ${night_wakings || 0} times (${waking_duration || 0} minutes total)
- Nap 1: ${nap1_time ? `${nap1_time} for ${nap1_duration} minutes` : "none"}
- Nap 2: ${nap2_time ? `${nap2_time} for ${nap2_duration} minutes` : "none"}
- Child's mood today: ${child_mood || "not specified"}
${memoriesContext}
${recentSleepContext}

Give me:
1. Suggested bedtime window for tonight with explanation
2. Three specific things to do tonight
3. One thing to watch for`
    }]
  });

  const text = response.content.find(b => b.type === "text") as { type: string; text: string } | undefined;
  const plan = text?.text || "";

  // Save sleep log
  const { data: inserted } = await supabase.from("sleep_logs").insert([{
    email,
    child_name,
    child_id,
    bedtime,
    wake_time,
    total_hours: parseFloat(total_hours) || null,
    night_wakings: parseInt(night_wakings) || 0,
    waking_duration: parseInt(waking_duration) || 0,
    nap1_time,
    nap1_duration: parseInt(nap1_duration) || null,
    nap2_time,
    nap2_duration: parseInt(nap2_duration) || null,
    child_mood,
    plan_generated: plan,
    log_date: new Date().toISOString().split("T")[0]
  }]).select();

  // Save sleep summary to memories
  const sleepMemory = `Sleep on ${new Date().toLocaleDateString()}: ${total_hours}h total, ${night_wakings} wakings, mood ${child_mood}`;
  await supabase.from("memories").insert([{
    email,
    child_name,
    memory: sleepMemory
  }]);

  return Response.json({ plan, log_id: inserted?.[0]?.id });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ logs: [] }, { status: 401 });
  const email = session.user.email;

  const { searchParams } = new URL(req.url);
  const child_name = searchParams.get("child_name");

  const { data } = await supabase
    .from("sleep_logs")
    .select("*")
    .eq("email", email)
    .eq("child_name", child_name || "")
    .order("created_at", { ascending: false })
    .limit(10);

  return Response.json({ logs: data || [] });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ ok: false }, { status: 401 });
  const email = session.user.email;

  const { log_id, outcome, outcome_notes } = await req.json();
  if (!log_id) return Response.json({ ok: false });

  // Verify ownership
  const { data: log } = await supabase
    .from("sleep_logs")
    .select("id, child_name")
    .eq("id", log_id)
    .eq("email", email)
    .single();

  if (!log) return Response.json({ ok: false }, { status: 404 });

  await supabase
    .from("sleep_logs")
    .update({ outcome, outcome_notes })
    .eq("id", log_id);

  return Response.json({ ok: true });
}
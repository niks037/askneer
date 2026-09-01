import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const email = session.user.email;

  const { message, history } = await req.json();

  // Get profile from server — never trust profile data from browser
  const { data: profileData } = await supabase
    .from("profiles")
    .select("child_name, child_dob, child_notes, is_pro")
    .eq("email", email)
    .eq("is_active", true)
    .single();

  if (!profileData) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }

  const isPro = profileData.is_pro || false;

  // Calculate age server-side
  const getAge = (dob: string) => {
    if (!dob) return "";
    const birth = new Date(dob);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months < 12) return `${months} month${months !== 1 ? "s" : ""} old`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years}y ${rem}m old` : `${years} year${years !== 1 ? "s" : ""} old`;
  };

  const childName = profileData.child_name;
  const childAge = getAge(profileData.child_dob);
  const childNotes = profileData.child_notes || "";

  // Enforce daily limit for free users
  if (!isPro) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("chats")
      .select("*", { count: "exact", head: true })
      .eq("email", email)
      .eq("role", "user")
      .gte("created_at", today.toISOString());

    if ((count || 0) >= 3) {
      return Response.json({ error: "limit_reached", reply: null }, { status: 403 });
    }
  }

  // Fetch memories for this child
  const { data: memoriesData } = await supabase
    .from("memories")
    .select("memory")
    .eq("email", email)
    .eq("child_name", childName)
    .order("created_at", { ascending: true })
    .limit(20);

  const memories = (memoriesData || []).map((r) => r.memory);
  const memoriesBlock = memories.length
    ? `\n\nWhat you remember about ${childName}:\n${memories.map((m) => `- ${m}`).join("\n")}`
    : "";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 350,
    system: `You are AskNeer, a warm and knowledgeable parenting companion created by NeernMom. You are currently helping a parent with their child named ${childName}, who is ${childAge} old. ${childNotes ? `Additional context: ${childNotes}` : ""}${memoriesBlock}

Always address the child by name. Reference memories naturally when relevant — don't list them out, just use them to give better answers. You only answer questions related to parenting, child development, baby care, pregnancy, toddler behavior, sleep, feeding, milestones, and family wellbeing. If someone asks anything outside these topics, respond warmly: "I'm AskNeer, your parenting companion! I'm only able to help with parenting and child-related questions." Respond in warm, conversational paragraphs only. No markdown, no bullet points, no asterisks, no headers, no emojis.

IMPORTANT LENGTH RULES:
- Keep responses under 120 words for simple questions
- Maximum 200 words even for complex topics
- Break longer responses into 2-3 short paragraphs with line breaks
- Get to the point quickly - parents are busy and often reading one-handed while holding a child
- End with a short, caring follow-up question only when it genuinely helps

MEDICAL SAFETY RULES:
- Never diagnose symptoms or conditions
- Never recommend specific medications or dosages
- For urgent symptoms (high fever, breathing difficulty, severe pain, rash spreading fast, child unresponsive), always say clearly: "This needs medical attention — please contact your pediatrician or emergency services right away."
- For general health questions, remind parents you provide general guidance only and to consult their doctor for medical decisions
- When uncertain, always err on the side of recommending professional consultation`,
    messages: history.slice(-20).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  const text = response.content.find((b: { type: string }) => b.type === "text") as
    | { type: string; text: string }
    | undefined;
  const reply = text?.text || "";

  // Save messages to Supabase
  await supabase.from("chats").insert([
    { child_name: childName, child_age: childAge, role: "user", content: message, email },
    { child_name: childName, child_age: childAge, role: "assistant", content: reply, email },
  ]);

  // Trigger memory extraction in background
  const baseUrl = process.env.NEXTAUTH_URL || "https://www.askneer.com";
  fetch(`${baseUrl}/api/memories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      child_name: childName,
      messages: [...history, { role: "user", content: message }, { role: "assistant", content: reply }],
    }),
  }).catch(() => {});

  return Response.json({ reply });
}
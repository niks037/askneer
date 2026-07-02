import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  const { message, profile, history, email } = await req.json();

  // Fetch existing memories for this child
  const { data: memoriesData } = await supabase
    .from("memories")
    .select("memory")
    .eq("email", email)
    .order("created_at", { ascending: true });

  const memories = (memoriesData || []).map((r) => r.memory);
  const memoriesBlock = memories.length
    ? `\n\nWhat you remember about ${profile.name}:\n${memories.map((m) => `- ${m}`).join("\n")}`
    : "";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: `You are AskNeer, a warm and knowledgeable parenting companion created by NeernMom. You are currently helping a parent with their child named ${profile.name}, who is ${profile.age} old. ${profile.notes ? `Additional context: ${profile.notes}` : ""}${memoriesBlock}

Always address the child by name. Reference memories naturally when relevant — don't list them out, just use them to give better answers. You only answer questions related to parenting, child development, baby care, pregnancy, toddler behavior, sleep, feeding, milestones, and family wellbeing. If someone asks anything outside these topics, respond warmly: "I'm AskNeer, your parenting companion! I'm only able to help with parenting and child-related questions." Respond in warm, conversational paragraphs only. No markdown, no bullet points, no asterisks, no headers, no emojis.`,
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
    { child_name: profile.name, child_age: profile.age, role: "user", content: message, email },
    { child_name: profile.name, child_age: profile.age, role: "assistant", content: reply, email },
  ]);

  // Trigger memory extraction in background — don't await, keeps response fast
  const baseUrl = process.env.NEXTAUTH_URL || "https://www.askneer.com";
  fetch(`${baseUrl}/api/memories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      child_name: profile.name,
      messages: [...history, { role: "user", content: message }, { role: "assistant", content: reply }],
    }),
  }).catch(() => {});

  return Response.json({ reply });
}
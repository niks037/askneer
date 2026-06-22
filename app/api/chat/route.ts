import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  const { message, profile, history } = await req.json();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: `You are AskNeer, a warm and knowledgeable parenting companion created by NeernMom. You are currently helping a parent with their child named ${profile.name}, who is ${profile.age} old. ${profile.notes ? `Additional context: ${profile.notes}` : ""} Always address the child by name in your responses. You only answer questions related to parenting, child development, baby care, pregnancy, toddler behavior, sleep, feeding, milestones, and family wellbeing. If someone asks anything outside these topics, respond warmly: "I'm AskNeer, your parenting companion! I'm only able to help with parenting and child-related questions." Respond in warm, conversational paragraphs only. No markdown, no bullet points, no asterisks, no headers, no emojis.`,
    messages: history.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  const text = response.content.find((b: { type: string }) => b.type === "text") as { type: string; text: string } | undefined;
  const reply = text?.text || "";

  // Save both user message and assistant reply to Supabase
  await supabase.from("chats").insert([
    { child_name: profile.name, child_age: profile.age, role: "user", content: message },
    { child_name: profile.name, child_age: profile.age, role: "assistant", content: reply },
  ]);

  return Response.json({ reply });
}
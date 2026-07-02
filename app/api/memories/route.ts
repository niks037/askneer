import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  const { email, child_name, messages } = await req.json();
  if (!email || !messages?.length) return Response.json({ ok: true });

  // Ask Claude to extract key facts from the conversation
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: `You are a memory extractor for a parenting app. 
Extract only important, long-term facts about the child from this conversation.
Things worth remembering: allergies, milestones, health events, medications, 
daycare/school, sleep issues, feeding preferences, behavioral patterns, 
developmental concerns, family context.
Return ONLY a JSON array of short fact strings. No explanation, no markdown.
Example: ["Allergic to peanuts", "Started walking at 11 months", "Attends Sunshine Daycare"]
If nothing important is found, return an empty array: []`,
    messages: [
      {
        role: "user",
        content: `Extract memorable facts about ${child_name} from this conversation:\n\n${messages
          .slice(-10)
          .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
          .join("\n")}`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text") as
    | { type: string; text: string }
    | undefined;
  if (!text?.text) return Response.json({ ok: true });

  let facts: string[] = [];
  try {
    const cleaned = text.text.replace(/```json|```/g, "").trim();
    facts = JSON.parse(cleaned);
  } catch {
    return Response.json({ ok: true });
  }

  if (!facts.length) return Response.json({ ok: true });

  // Fetch existing memories to avoid duplicates
  const { data: existing } = await supabase
    .from("memories")
    .select("memory")
    .eq("email", email);

  const existingSet = new Set((existing || []).map((r) => r.memory.toLowerCase()));

  const newFacts = facts.filter(
    (f) => !existingSet.has(f.toLowerCase())
  );

  if (newFacts.length) {
    await supabase.from("memories").insert(
      newFacts.map((memory) => ({ email, child_name, memory }))
    );
  }

  return Response.json({ ok: true, saved: newFacts.length });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) return Response.json({ memories: [] });

  const { data } = await supabase
    .from("memories")
    .select("memory")
    .eq("email", email)
    .order("created_at", { ascending: true });

  return Response.json({ memories: (data || []).map((r) => r.memory) });
}
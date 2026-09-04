import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  const internalSecret = req.headers.get("x-internal-secret");
  const isInternalCall = internalSecret && internalSecret === process.env.INTERNAL_API_SECRET;

  const body = await req.json();
  const { child_name, messages, email: bodyEmail } = body;

  const session = await auth();
  const email = session?.user?.email || (isInternalCall ? bodyEmail : null);

  if (!email || !messages?.length) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: `You are a memory extractor for a parenting app.
Your job is to extract, update, or remove facts about the child from this conversation.
Return a JSON object with two arrays:
- "add": new facts to remember
- "remove": keywords of facts to delete (e.g. if parent says "not allergic to strawberries", include "strawberr")
Rules:
- Extract only important, long-term facts: allergies, milestones, health events, medications, daycare/school, sleep issues, feeding preferences, behavioral patterns, developmental concerns, family context
- Keep each fact under 6 words when possible (e.g. "Takes swimming lessons" not "Started swimming lessons at age 4 years 3 months")
- If parent corrects something (e.g. "she is NOT allergic"), add the correction to "add" and the old fact keyword to "remove"
- If nothing important found, return {"add": [], "remove": []}
Example:
{"add": ["Not allergic to strawberries"], "remove": ["strawberr"]}
Return ONLY valid JSON. No markdown, no explanation.`,
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

  let result: { add: string[]; remove: string[] } = { add: [], remove: [] };
  try {
    const cleaned = text.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      result.add = parsed;
    } else {
      result = { add: parsed.add || [], remove: parsed.remove || [] };
    }
  } catch {
    return Response.json({ ok: true });
  }

  if (result.remove.length) {
    for (const keyword of result.remove) {
      await supabase
        .from("memories")
        .delete()
        .eq("email", email)
        .eq("child_name", child_name)
        .ilike("memory", `%${keyword}%`);
    }
  }

  if (result.add.length) {
    const { data: existing } = await supabase
      .from("memories")
      .select("memory")
      .eq("email", email)
      .eq("child_name", child_name);
    const existingSet = new Set((existing || []).map((r) => r.memory.toLowerCase()));
    const newFacts = result.add.filter((f) => !existingSet.has(f.toLowerCase()));
    if (newFacts.length) {
      await supabase.from("memories").insert(
        newFacts.map((memory) => ({ email, child_name, memory }))
      );
    }
  }

  return Response.json({ ok: true });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ memories: [] }, { status: 401 });
  const email = session.user.email;

  const { searchParams } = new URL(req.url);
  const child_name = searchParams.get("child_name");

  let query = supabase
    .from("memories")
    .select("memory, source")
    .eq("email", email)
    .order("created_at", { ascending: true });

  if (child_name) {
    query = query.eq("child_name", child_name);
  }

  const { data } = await query;
  return Response.json({ memories: (data || []).map((r) => ({ memory: r.memory, source: r.source || 'ai' })) });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ ok: false }, { status: 401 });
  const email = session.user.email;

  const { child_name, old_memory, new_memory } = await req.json();
  if (!old_memory) return Response.json({ ok: false });

  await supabase
    .from("memories")
    .update({ 
      memory: new_memory || old_memory,
      source: 'parent'
    })
    .eq("email", email)
    .eq("child_name", child_name)
    .ilike("memory", `%${old_memory}%`);

  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ ok: false }, { status: 401 });
  const email = session.user.email;

  const { child_name, memory_text } = await req.json();
  if (!memory_text) return Response.json({ ok: false });

  await supabase
    .from("memories")
    .delete()
    .eq("email", email)
    .eq("child_name", child_name)
    .ilike("memory", `%${memory_text}%`);

  return Response.json({ ok: true });
}
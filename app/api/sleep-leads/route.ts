import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  // Honeypot: real people never fill this hidden field. Pretend success.
  if (typeof body.website === "string" && body.website.length > 0) {
    return Response.json({ ok: true });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return Response.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  const source = body.source === "plan" ? "plan" : "guide";
  const src = String(body.src ?? "").slice(0, 60) || null;

  // Only the columns we send are updated, so a later "plan" signup keeps got_guide = true.
  const row =
    source === "plan"
      ? { email, wants_plan: true, src }
      : { email, got_guide: true, src };

  const { error } = await supabase
    .from("sleep_leads")
    .upsert([row], { onConflict: "email" });

  if (error) {
    console.error("sleep_leads upsert failed:", error.message);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return Response.json({ ok: true });
}

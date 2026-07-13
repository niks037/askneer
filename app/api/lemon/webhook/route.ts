import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;

  // Verify webhook signature
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const digest = hmac.digest("hex");

  if (digest !== signature) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventName = payload.meta?.event_name;
  const email = payload.meta?.custom_data?.email;
  const subscriptionId = payload.data?.id;
  const customerId = payload.data?.attributes?.customer_id?.toString();
  const status = payload.data?.attributes?.status;
  const trialEndsAt = payload.data?.attributes?.trial_ends_at;

  console.log("Webhook received:", eventName, email, status);

  if (!email) {
    console.error("No email in webhook payload");
    return Response.json({ ok: true });
  }

  if (eventName === "subscription_created") {
    // New subscription — mark as Pro
    await supabase
      .from("profiles")
      .update({
        is_pro: true,
        subscription_id: subscriptionId,
        customer_id: customerId,
        trial_ends_at: trialEndsAt || null,
      })
      .eq("email", email);
  }

  if (eventName === "subscription_updated") {
    const isPro = status === "active" || status === "on_trial";
    await supabase
      .from("profiles")
      .update({
        is_pro: isPro,
        subscription_id: subscriptionId,
        customer_id: customerId,
        trial_ends_at: trialEndsAt || null,
      })
      .eq("email", email);
  }

  if (eventName === "subscription_cancelled") {
    await supabase
      .from("profiles")
      .update({
        is_pro: false,
        subscription_id: null,
      })
      .eq("email", email);
  }

  return Response.json({ ok: true });
}
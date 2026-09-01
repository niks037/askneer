import { createClient } from "@supabase/supabase-js";
import DodoPayments from "dodopayments";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY || process.env.DODO_API_KEY,
  baseURL: process.env.DODO_PAYMENTS_BASE_URL || "https://live.dodopayments.com",
  webhookKey: process.env.DODO_WEBHOOK_SECRET,
});

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers = {
    "webhook-id": req.headers.get("webhook-id") || "",
    "webhook-signature": req.headers.get("webhook-signature") || "",
    "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
  };

  let payload: any;

  try {
    payload = dodo.webhooks.unwrap(rawBody, { headers });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const eventType = payload.type;
  const data = payload.data;

  console.log("Dodo webhook received:", eventType);

  const email =
    data?.metadata?.email ||
    data?.customer?.email ||
    null;

  if (!email) {
    console.error("No email found in webhook payload");
    return Response.json({ ok: true });
  }

  try {
    if (eventType === "subscription.active" || eventType === "payment.succeeded") {
      await supabase
        .from("profiles")
        .update({
          is_pro: true,
          is_active: true,
          subscription_id: data?.subscription_id || data?.id,
          customer_id: data?.customer?.customer_id,
          trial_ends_at: data?.trial_period_end || null,
        })
        .eq("email", email);
      console.log("Upgraded to Pro:", email);

    } else if (eventType === "subscription.cancelled") {
      // User cancelled — keep Pro until period ends
      // Dodo will send subscription.expired when access actually ends
      await supabase
        .from("profiles")
        .update({
          subscription_id: data?.subscription_id || data?.id,
        })
        .eq("email", email);
      console.log("Subscription cancelled but Pro continues until period end:", email);

    } else if (eventType === "subscription.expired") {
      // Access actually ended — remove Pro now
      await supabase
        .from("profiles")
        .update({ is_pro: false, subscription_id: null })
        .eq("email", email);
      console.log("Pro access ended:", email);

    } else if (eventType === "subscription.on_hold") {
      console.log("Subscription on hold:", email);
    }

  } catch (error) {
    console.error("Webhook processing error:", error);
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
 
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("webhook-signature") || "";
  const secret = process.env.DODO_WEBHOOK_SECRET || "";

  // Verify signature
  const expectedSig = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSig) {
    console.error("Invalid webhook signature");
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventType = payload.type;
  const data = payload.data;

  console.log("Dodo webhook received:", eventType);

  // Get email from metadata or customer
  const email =
    data?.metadata?.email ||
    data?.customer?.email ||
    null;

  if (!email) {
    console.error("No email found in webhook payload");
    return Response.json({ ok: true });
  }

  try {
    if (
      eventType === "subscription.active"
    ) {
      // Upgrade to Pro
      await supabase
        .from("profiles")
        .update({
          is_pro: true,
          subscription_id: data?.subscription_id || data?.id,
          customer_id: data?.customer?.customer_id,
          trial_ends_at: data?.trial_period_end || null,
        })
        .eq("email", email);

      console.log("Upgraded to Pro:", email);

    } else if (
      eventType === "subscription.cancelled" ||
      eventType === "subscription.expired"
    ) {
      // Downgrade from Pro
      await supabase
        .from("profiles")
        .update({
          is_pro: false,
          subscription_id: null,
        })
        .eq("email", email);

      console.log("Downgraded from Pro:", email);

    } else if (eventType === "subscription.on_hold") {
      // Payment failed — keep Pro for now but flag it
      console.log("Subscription on hold:", email);
    }

  } catch (error) {
    console.error("Webhook processing error:", error);
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
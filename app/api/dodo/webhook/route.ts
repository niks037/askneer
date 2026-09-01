import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

function verifySignature(payload: string, signature: string, timestamp: string): boolean {
  let secret = process.env.DODO_WEBHOOK_SECRET || "";
  
  // Standard Webhooks: if secret starts with whsec_, base64 decode it
  if (secret.startsWith("whsec_")) {
    secret = secret.slice(6); // remove whsec_ prefix
    const secretBytes = Buffer.from(secret, "base64");
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac("sha256", secretBytes)
      .update(signedPayload)
      .digest("base64");
    const providedSig = signature.split(",")[1];
    if (!providedSig) return false;
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(providedSig)
      );
    } catch {
      return false;
    }
  }

  // Plain secret (no prefix)
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("base64");
  const providedSig = signature.split(",")[1];
  if (!providedSig) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(providedSig)
    );
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("webhook-signature") || "";
  const timestamp = req.headers.get("webhook-timestamp") || "";

  if (!verifySignature(rawBody, signature, timestamp)) {
    console.error("Invalid webhook signature");
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
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

    } else if (eventType === "subscription.cancelled" || eventType === "subscription.expired") {
      await supabase
        .from("profiles")
        .update({ is_pro: false, subscription_id: null })
        .eq("email", email);
      console.log("Downgraded from Pro:", email);

    } else if (eventType === "subscription.on_hold") {
      console.log("Subscription on hold:", email);
    }

  } catch (error) {
    console.error("Webhook processing error:", error);
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
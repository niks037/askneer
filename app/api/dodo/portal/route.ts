import DodoPayments from "dodopayments";
import { createClient } from "@supabase/supabase-js";

const dodo = new DodoPayments({
  bearerToken:
    process.env.DODO_PAYMENTS_API_KEY || process.env.DODO_API_KEY,
  baseURL:
    process.env.DODO_PAYMENTS_BASE_URL ||
    "https://live.dodopayments.com",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return Response.json(
      { error: "Email required" },
      { status: 400 }
    );
  }

  // Get customer_id from Supabase
  const { data: profile } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("email", email)
    .eq("is_active", true)
    .single();

  if (!profile?.customer_id) {
    return Response.json(
      { error: "No subscription found" },
      { status: 404 }
    );
  }

  try {
    const portal = await dodo.customers.customerPortal.create(
      profile.customer_id
    );

    return Response.json({
      url: portal.link,
    });
  } catch (error) {
    console.error("Portal error:", error);

    return Response.json(
      { error: "Failed to get portal" },
      { status: 500 }
    );
  }
}
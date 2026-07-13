import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  const { email, name } = await req.json();

  if (!email) return Response.json({ error: "Email required" }, { status: 400 });

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      "Content-Type": "application/vnd.api+json",
      "Accept": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email,
            name,
            custom: { email },
          },
          product_options: {
            redirect_url: "https://www.askneer.com?upgraded=true",
            receipt_link_url: "https://www.askneer.com",
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: process.env.LEMONSQUEEZY_STORE_ID,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: process.env.LEMONSQUEEZY_VARIANT_ID,
            },
          },
        },
      },
    }),
  });

  const data = await response.json();
  const checkoutUrl = data?.data?.attributes?.url;

  if (!checkoutUrl) {
    console.error("Lemon Squeezy error:", JSON.stringify(data));
    return Response.json({ error: "Failed to create checkout" }, { status: 500 });
  }

  return Response.json({ url: checkoutUrl });
}
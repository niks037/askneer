import DodoPayments from "dodopayments";

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY,
  baseURL: "https://test.dodopayments.com",
});

export async function POST(req: Request) {
  const { email, name } = await req.json();
  // DEBUG - remove after fixing    
  console.log("API KEY starts with:", process.env.DODO_API_KEY?.substring(0, 10));
  console.log("BASE URL:", process.env.DODO_PAYMENTS_BASE_URL);
  if (!email) return Response.json({ error: "Email required" }, { status: 400 });

  try {
    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: process.env.DODO_PRODUCT_ID!,
          quantity: 1,
        },
      ],
      customer: {
        email: email,
        name: name || email,
      },
      return_url: "https://www.askneer.com/?upgraded=true",
      metadata: {
        email: email,
      },
    });

    if (session.checkout_url) {
      return Response.json({ url: session.checkout_url });
    } else {
      console.error("Dodo session error:", session);
      return Response.json({ error: "Failed to create checkout" }, { status: 500 });
    }
  } catch (error) {
    console.error("Dodo checkout exception:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
import DodoPayments from "dodopayments";

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY,
  environment: "test_mode",
});

export async function POST(req: Request) {
  const { email, name } = await req.json();

  if (!email) {
    return Response.json({ error: "Email required" }, { status: 400 });
  }

  try {
    const subscription = await dodo.subscriptions.create({
      billing: {
        city: "",
        country: "US",
        state: "",
        street: "",
        zipcode: "",
      },
      customer: {
        email: email,
        name: name || email,
        create_new_customer: true,
      },
      product_id: process.env.DODO_PRODUCT_ID!,
      quantity: 1,
      payment_link: true,
      return_url: "https://www.askneer.com/?upgraded=true",
      metadata: {
        email: email,
      },
    });

    if (subscription.payment_link) {
      return Response.json({ url: subscription.payment_link });
    } else {
      console.error("Dodo checkout error:", subscription);
      return Response.json({ error: "Failed to create checkout" }, { status: 500 });
    }
  } catch (error) {
    console.error("Dodo checkout exception:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
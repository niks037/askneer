 
export async function POST(req: Request) {
  const { email, name } = await req.json();

  if (!email) {
    return Response.json({ error: "Email required" }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.dodopayments.com/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DODO_API_KEY}`,
      },
      body: JSON.stringify({
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
        product_id: process.env.DODO_PRODUCT_ID,
        quantity: 1,
        payment_link: true,
        return_url: "https://www.askneer.com/?upgraded=true",
        metadata: {
          email: email,
        },
      }),
    });

    const data = await response.json();

    if (data.payment_link) {
      return Response.json({ url: data.payment_link });
    } else {
      console.error("Dodo checkout error:", data);
      return Response.json({ error: "Failed to create checkout" }, { status: 500 });
    }
  } catch (error) {
    console.error("Dodo checkout error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
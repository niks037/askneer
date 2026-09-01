import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ messages: [] }, { status: 401 });
  const email = session.user.email;

  const { data } = await supabase
    .from("chats")
    .select("role, content")
    .eq("email", email)
    .order("created_at", { ascending: true })
    .limit(50);

  return Response.json({ messages: data || [] });
}
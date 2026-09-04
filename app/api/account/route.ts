import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email;

  // Delete all user data
  await supabase.from("memories").delete().eq("email", email);
  await supabase.from("chats").delete().eq("email", email);
  await supabase.from("vaccinations").delete().eq("email", email);
  await supabase.from("sleep_logs").delete().eq("email", email);
  await supabase.from("daily_checkins").delete().eq("email", email);
  await supabase.from("profiles").delete().eq("email", email);

  return Response.json({ ok: true });
}
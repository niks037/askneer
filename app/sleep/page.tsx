import type { Metadata } from "next";
import SleepLanding from "@/components/SleepLanding";

export const metadata: Metadata = {
  title: "Free baby sleep cheat sheet (6–18 months) | AskNeer",
  description:
    "Why your baby keeps waking at night, and 3 fixes to try tonight. A free cheat sheet for parents of babies 6 to 18 months.",
  openGraph: {
    title: "2:07 AM. Wide awake. Again.",
    description:
      "Get the free sleep cheat sheet for babies 6 to 18 months: the 4 usual reasons they wake and 3 fixes to try tonight.",
    type: "website",
  },
};

export default async function SleepPage({
  searchParams,
}: {
  searchParams: Promise<{ src?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.src) ? sp.src[0] : sp.src;
  return <SleepLanding src={(raw ?? "").slice(0, 60)} />;
}

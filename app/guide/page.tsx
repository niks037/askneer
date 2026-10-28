import type { Metadata } from 'next'
import AgeGuide from '@/components/AgeGuide'

export const metadata: Metadata = {
  title: "What's normal at this age? | AskNeer",
  description:
    'A simple age-by-age guide for parents, from newborn to 3 years: what you may be seeing, why it happens and what tends to help.',
}

export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const raw = Array.isArray(sp.m) ? sp.m[0] : sp.m
  const parsed = Number(raw)
  const initial = Number.isFinite(parsed) ? parsed : 12
  return <AgeGuide initialMonths={initial} />
}

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// WHO global vaccine schedule — weeks/months after birth
const WHO_SCHEDULE = [
  { name: "BCG", description: "Protects against tuberculosis", weeks: 0 },
  { name: "Hepatitis B (Birth)", description: "Protects against Hepatitis B virus", weeks: 0 },
  { name: "DTaP #1", description: "Protects against diphtheria, tetanus, and whooping cough", weeks: 6 },
  { name: "Polio (IPV) #1", description: "Protects against poliomyelitis", weeks: 6 },
  { name: "Hib #1", description: "Protects against Haemophilus influenzae type b", weeks: 6 },
  { name: "Rotavirus #1", description: "Protects against rotavirus diarrhea", weeks: 6 },
  { name: "PCV #1", description: "Protects against pneumococcal disease", weeks: 6 },
  { name: "DTaP #2", description: "Protects against diphtheria, tetanus, and whooping cough", weeks: 10 },
  { name: "Polio (IPV) #2", description: "Protects against poliomyelitis", weeks: 10 },
  { name: "Hib #2", description: "Protects against Haemophilus influenzae type b", weeks: 10 },
  { name: "Rotavirus #2", description: "Protects against rotavirus diarrhea", weeks: 10 },
  { name: "PCV #2", description: "Protects against pneumococcal disease", weeks: 10 },
  { name: "DTaP #3", description: "Protects against diphtheria, tetanus, and whooping cough", weeks: 14 },
  { name: "Polio (IPV) #3", description: "Protects against poliomyelitis", weeks: 14 },
  { name: "Hib #3", description: "Protects against Haemophilus influenzae type b", weeks: 14 },
  { name: "Rotavirus #3", description: "Protects against rotavirus diarrhea", weeks: 14 },
  { name: "PCV #3", description: "Protects against pneumococcal disease", weeks: 14 },
  { name: "Hepatitis B #2", description: "Protects against Hepatitis B virus", weeks: 24 },
  { name: "Influenza #1", description: "Protects against seasonal flu", weeks: 24 },
  { name: "MMR #1", description: "Protects against measles, mumps, and rubella", weeks: 36 },
  { name: "Hepatitis A #1", description: "Protects against Hepatitis A virus", weeks: 52 },
  { name: "Varicella #1", description: "Protects against chickenpox", weeks: 52 },
  { name: "MMR #2", description: "Protects against measles, mumps, and rubella", weeks: 60 },
  { name: "PCV Booster", description: "Booster dose for pneumococcal disease", weeks: 60 },
  { name: "Hepatitis A #2", description: "Protects against Hepatitis A virus", weeks: 78 },
  { name: "DTaP Booster", description: "Booster for diphtheria, tetanus, whooping cough", weeks: 78 },
  { name: "Polio Booster", description: "Booster dose for poliomyelitis", weeks: 78 },
  { name: "DTaP #5", description: "Protects against diphtheria, tetanus, and whooping cough", weeks: 260 },
  { name: "Polio #5", description: "Protects against poliomyelitis", weeks: 260 },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const child_name = searchParams.get("child_name");
  const dob = searchParams.get("dob");

  if (!email || !dob) return Response.json({ vaccines: [] });

  // Check if vaccines already generated for this child
  const { data: existing } = await supabase
    .from("vaccinations")
    .select("*")
    .eq("email", email)
    .eq("child_name", child_name);

  if (existing && existing.length > 0) {
    return Response.json({ vaccines: existing });
  }

  // Generate schedule from DOB
  const birthDate = new Date(dob);
  const vaccines = WHO_SCHEDULE.map((v) => {
    const due = new Date(birthDate);
    due.setDate(due.getDate() + v.weeks * 7);
    return {
      email,
      child_name,
      vaccine_name: v.name,
      due_date: due.toISOString().split("T")[0],
      completed: false,
    };
  });

  // Insert into Supabase
  const { data: inserted } = await supabase
    .from("vaccinations")
    .insert(vaccines)
    .select();

  return Response.json({ vaccines: inserted || [] });
}

export async function PATCH(req: Request) {
  const { id, completed, completed_date } = await req.json();

  const { data } = await supabase
    .from("vaccinations")
    .update({ completed, completed_date: completed_date || null })
    .eq("id", id)
    .select();

  return Response.json({ vaccine: data?.[0] });
}
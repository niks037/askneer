"use client";

import { useState } from "react";

const WHATSAPP_URL = process.env.NEXT_PUBLIC_SLEEP_WHATSAPP_URL || "";
const PLAN_URL = process.env.NEXT_PUBLIC_SLEEP_PLAN_URL || "";

const INK = "#3D2B24";
const TERRA = "#E07A5F";
const CREAM = "#FFF9F5";

const wrap: React.CSSProperties = { maxWidth: 640, margin: "0 auto", padding: "0 20px" };
const btn: React.CSSProperties = {
  display: "block", width: "100%", textAlign: "center", background: TERRA, color: "#fff",
  border: "none", borderRadius: 999, padding: "16px 20px", fontSize: 16, fontWeight: 700,
  cursor: "pointer", textDecoration: "none", boxSizing: "border-box",
};

function SignupForm({ source, label, onDone }: { source: "guide" | "plan"; label: string; onDone?: () => void }) {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    try {
      const src = new URLSearchParams(window.location.search).get("src") || "";
      const r = await fetch("/api/sleep-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website: hp, source, src }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Something went wrong.");
      setState("done");
      onDone?.();
    } catch (err) {
      setState("err");
      setMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (state === "done") {
    return (
      <div style={{ background: "#fff", border: "1px solid #F0D9CF", borderRadius: 16, padding: 20 }}>
        <p style={{ margin: 0, fontWeight: 700, color: INK }}>
          {source === "guide" ? "You're in. Your cheat sheet is ready." : "You're on the list."}
        </p>
        {source === "guide" ? (
          <a href="/NeernMom_Free_Sleep_Cheat_Sheet.pdf" download style={{ ...btn, marginTop: 14 }}>
            Download the free cheat sheet (PDF)
          </a>
        ) : (
          <p style={{ margin: "8px 0 0", color: "#6B5A52", fontSize: 14 }}>
            We'll email you the moment launch access opens.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <input
        type="email" required placeholder="Your email" value={email}
        onChange={(e) => setEmail(e.target.value)} autoComplete="email"
        style={{ width: "100%", boxSizing: "border-box", padding: "15px 18px", fontSize: 16, borderRadius: 999, border: "1.5px solid #E8CFC4", marginBottom: 10, background: "#fff", color: INK }}
      />
      <input
        type="text" name="website" tabIndex={-1} autoComplete="off" value={hp}
        onChange={(e) => setHp(e.target.value)} aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />
      <button type="submit" disabled={state === "busy"} style={{ ...btn, opacity: state === "busy" ? 0.7 : 1 }}>
        {state === "busy" ? "One moment…" : label}
      </button>
      {state === "err" && <p style={{ color: "#B3392B", fontSize: 14, margin: "8px 0 0" }}>{msg}</p>}
      <p style={{ color: "#8A776E", fontSize: 12, margin: "10px 0 0", textAlign: "center" }}>
        No spam. Unsubscribe any time.
      </p>
    </form>
  );
}

export default function SleepLanding({ src }: { src?: string }) {
  void src;
  return (
    <main style={{ background: CREAM, minHeight: "100vh", color: INK, fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif", paddingBottom: 60 }}>
      <section style={{ ...wrap, paddingTop: 44 }}>
        <p style={{ letterSpacing: 2, fontSize: 12, fontWeight: 700, color: TERRA, margin: 0 }}>
          FREE CHEAT SHEET · BABIES 6–18 MONTHS
        </p>
        <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 38, lineHeight: 1.12, margin: "12px 0 14px" }}>
          2:07 AM. Wide awake. <span style={{ textDecoration: "underline", textDecorationColor: TERRA, textDecorationThickness: 3, textUnderlineOffset: 6 }}>Again.</span>
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.55, color: "#5A453C", margin: "0 0 22px" }}>
          You're exhausted. You've tried the rocking, the feeding, the guessing. Most night wakings
          in this age range come down to a few fixable things. This cheat sheet shows you the 4 usual
          reasons and 3 fixes to try tonight.
        </p>
        <SignupForm source="guide" label="Send me the free cheat sheet" />
      </section>

      <section style={{ ...wrap, paddingTop: 44 }}>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 26, margin: "0 0 14px" }}>Sound familiar?</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {[
            "Your baby fell asleep fine, then woke up 45 minutes later.",
            "Naps are 30 minutes and you can't plan anything.",
            "You're awake at 5 AM and it's not a morning you chose.",
            "You've read ten articles and each one says something different.",
          ].map((t) => (
            <li key={t} style={{ background: "#fff", border: "1px solid #F0D9CF", borderRadius: 14, padding: "14px 16px", lineHeight: 1.45 }}>{t}</li>
          ))}
        </ul>
        <p style={{ marginTop: 16, color: "#5A453C", lineHeight: 1.55 }}>
          Broken sleep isn't a sign you're doing it wrong. It's usually timing, routine or a
          transition the baby is working through, and all of those can be adjusted.
        </p>
      </section>

      <section style={{ ...wrap, paddingTop: 44 }}>
        <div style={{ background: INK, color: "#fff", borderRadius: 22, padding: "28px 22px" }}>
          <p style={{ letterSpacing: 2, fontSize: 12, fontWeight: 700, color: "#F2B5A1", margin: 0 }}>NEXT STEP</p>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 28, lineHeight: 1.15, margin: "10px 0 8px" }}>
            The NeernMom Sleep Plan
          </h2>
          <p style={{ margin: "0 0 14px", color: "#F3E4DC" }}>14 nights to calmer nights (6–18 months)</p>
          <ul style={{ margin: "0 0 18px", paddingLeft: 20, lineHeight: 1.7, color: "#F3E4DC" }}>
            <li>A night-by-night plan built for your baby's age</li>
            <li>Sample schedules, including the nap transition</li>
            <li>Gentle options, so you choose what fits your family</li>
            <li>Troubleshooting for early waking, short naps and rough patches</li>
            <li>Printable sleep logs and checklists</li>
            <li>A parent support group</li>
          </ul>
          {PLAN_URL ? (
            <a href={PLAN_URL} style={btn}>Get the Sleep Plan now</a>
          ) : (
            <div style={{ background: "#fff", borderRadius: 16, padding: 16, color: INK }}>
              <p style={{ margin: "0 0 10px", fontWeight: 700 }}>Get launch access first</p>
              <SignupForm source="plan" label="Notify me when it opens" />
            </div>
          )}
          <p style={{ fontSize: 12, color: "#D9C2B8", margin: "14px 0 0", lineHeight: 1.5 }}>
            Every baby is different and results aren't guaranteed. This is general information, not medical advice.
            If your baby has trouble breathing, feeds poorly, has a fever or you're worried, call your doctor.
          </p>
        </div>
      </section>

      {WHATSAPP_URL && (
        <section style={{ ...wrap, paddingTop: 28 }}>
          <a href={WHATSAPP_URL} style={{ ...btn, background: "#25D366" }}>Join the parents' WhatsApp group</a>
        </section>
      )}

      <p style={{ ...wrap, fontSize: 12, color: "#8A776E", textAlign: "center", paddingTop: 36 }}>
        © NeernMom · askneer.com
      </p>
    </main>
  );
}

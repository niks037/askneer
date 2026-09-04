export default function Subprocessors() {
  const processors = [
    {
      provider: "Anthropic",
      purpose: "AI response generation",
      data: "Chat messages, child name, age, memories (up to 20 messages)",
      location: "United States",
      retention: "7 days - never used for model training",
      link: "https://www.anthropic.com/privacy"
    },
    {
      provider: "Supabase",
      purpose: "Secure database storage",
      data: "All account and child profile data",
      location: "United States",
      retention: "While account is active",
      link: "https://supabase.com/privacy"
    },
    {
      provider: "Vercel",
      purpose: "App hosting and deployment",
      data: "Technical request data, IP addresses",
      location: "United States",
      retention: "Per Vercel DPA",
      link: "https://vercel.com/legal/privacy-policy"
    },
    {
      provider: "Google OAuth",
      purpose: "Sign-in authentication",
      data: "Name and email address only",
      location: "United States",
      retention: "Per Google Privacy Policy",
      link: "https://policies.google.com/privacy"
    },
    {
      provider: "Dodo Payments",
      purpose: "Payment processing",
      data: "Billing information - we never see card details",
      location: "United States",
      retention: "Per Dodo Payments Privacy Policy",
      link: "https://dodopayments.com/privacy-policy"
    },
  ]

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "'Segoe UI', sans-serif", color: "#2D2D2D", lineHeight: 1.8 }}>
      <div style={{ marginBottom: 40 }}>
        <a href="/" style={{ color: "#E07A5F", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>← Back to AskNeer</a>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5 }}>Subprocessors</h1>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 8 }}>Last updated: September 2026</p>
      <p style={{ color: "#555", fontSize: 15, marginBottom: 40, lineHeight: 1.7 }}>
        AskNeer uses the following third-party service providers to operate. Each provider processes only the data necessary to provide their specific service. We do not sell your data to any of these providers or allow them to use it for their own purposes.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 48 }}>
        {processors.map(p => (
          <div key={p.provider} style={{ background: "white", border: "1px solid #F0EDED", borderRadius: 14, padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#2D2D2D" }}>{p.provider}</h2>
              <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#E07A5F", textDecoration: "none" }}>Privacy Policy →</a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "6px 16px", fontSize: 14 }}>
              <span style={{ color: "#999", fontWeight: 600 }}>Purpose</span>
              <span style={{ color: "#444" }}>{p.purpose}</span>
              <span style={{ color: "#999", fontWeight: 600 }}>Data processed</span>
              <span style={{ color: "#444" }}>{p.data}</span>
              <span style={{ color: "#999", fontWeight: 600 }}>Location</span>
              <span style={{ color: "#444" }}>{p.location}</span>
              <span style={{ color: "#999", fontWeight: 600 }}>Retention</span>
              <span style={{ color: "#444" }}>{p.retention}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "#FFF0E8", border: "1px solid #F4C5B4", borderRadius: 12, padding: "16px 20px", marginBottom: 40 }}>
        <p style={{ margin: 0, fontSize: 14, color: "#993C1D", lineHeight: 1.6 }}>
          <strong>Note on Anthropic:</strong> AskNeer uses Anthropic's commercial API - not the consumer Claude.ai service. Under commercial API terms, your data is never used to train AI models and is deleted after 7 days.
        </p>
      </div>

      <p style={{ fontSize: 14, color: "#888" }}>
        Questions about our subprocessors? Email us at{" "}
        <a href="mailto:info@askneer.com" style={{ color: "#E07A5F" }}>info@askneer.com</a>
      </p>

      <div style={{ borderTop: "1px solid #F0EDED", paddingTop: 24, marginTop: 40 }}>
        <p style={{ fontSize: 13, color: "#aaa" }}>
          © 2026 AskNeer · Powered by NeernMom ·{" "}
          <a href="/privacy" style={{ color: "#E07A5F", textDecoration: "none" }}>Privacy Policy</a>
          {" · "}
          <a href="/terms" style={{ color: "#E07A5F", textDecoration: "none" }}>Terms of Service</a>
          {" · "}
          <span style={{ color: "#E07A5F" }}>Not a medical service</span>
        </p>
      </div>
    </div>
  )
}
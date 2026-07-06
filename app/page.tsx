"use client";
import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import VaccineTracker from "@/components/VaccineTracker";

export default function Home() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState({ name: "", dob: "", notes: "" });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [showVaccines, setShowVaccines] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session?.user?.email) {
      loadProfile();
    } else if (status === "unauthenticated") {
      setProfileLoading(false);
    }
  }, [session?.user?.email, status]);

  if (!mounted || profileLoading) return (
    <div style={{ minHeight: "100vh", background: "#FFF9F5", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ color: "#E07A5F", fontSize: 16 }}>Loading...</div>
    </div>
  );

  function getAge(dob: string) {
    if (!dob) return "";
    const birth = new Date(dob);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months < 12) return `${months} month${months !== 1 ? "s" : ""} old`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years}y ${rem}m old` : `${years} year${years !== 1 ? "s" : ""} old`;
  }

  async function loadProfile() {
    if (!session?.user?.email) {
      setProfileLoading(false);
      return;
    }
    const res = await fetch(`/api/profile?email=${session.user.email}`);
    const data = await res.json();
    if (data.profile) {
      setProfile({ name: data.profile.child_name, dob: data.profile.child_dob, notes: data.profile.child_notes || "" });
      setProfileSaved(true);
    }
    const chatRes = await fetch(`/api/messages?email=${session.user.email}`);
    const chatData = await chatRes.json();
    if (chatData.messages?.length > 0) {
      setMessages(chatData.messages);
    }
    setProfileLoading(false);
  }

  async function saveProfileToDB(p: typeof profile) {
    if (!session?.user?.email) return;
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.user.email, child_name: p.name, child_dob: p.dob, child_notes: p.notes })
    });
  }

  function saveProfile() {
    if (!profile.name || !profile.dob) return alert("Please enter child's name and date of birth");
    saveProfileToDB(profile);
    setProfileSaved(true);
  }

  async function ask() {
    if (!input.trim()) return;
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem("askneer_date");
    const storedCount = parseInt(localStorage.getItem("askneer_count") || "0");
    if (storedDate === today && storedCount >= 5) {
      alert("You've used your 5 free questions for today! Upgrade to AskNeer Pro for unlimited questions.");
      return;
    }
    if (storedDate !== today) {
      localStorage.setItem("askneer_date", today);
      localStorage.setItem("askneer_count", "1");
    } else {
      localStorage.setItem("askneer_count", (storedCount + 1).toString());
    }
    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setChatLoading(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, profile: { ...profile, age: getAge(profile.dob) }, history: updatedMessages, email: session?.user?.email })
    });
    const data = await res.json();
    setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);
    setChatLoading(false);
  }

  // ─── Login screen ───────────────────────────────────────────────
  if (!session) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #FFF9F5 0%, #FFF0E8 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>👶</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#2D2D2D", margin: 0, letterSpacing: -1 }}>AskNeer</h1>
        <p style={{ color: "#888", marginTop: 8, fontSize: 16 }}>Your personal parenting companion</p>
        <p style={{ color: "#aaa", fontSize: 13, marginTop: 4 }}>Powered by NeernMom</p>
      </div>
      <div style={{ background: "white", borderRadius: 20, padding: 32, maxWidth: 380, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#2D2D2D" }}>Welcome</h2>
        <p style={{ color: "#888", margin: "0 0 24px", fontSize: 14, lineHeight: 1.6 }}>Get science-backed parenting guidance personalized to your child — available 24/7.</p>
        <button onClick={() => signIn("google")} style={{ width: "100%", padding: "14px 24px", background: "white", border: "2px solid #E8E8E8", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 600, color: "#2D2D2D", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
          onMouseOver={e => (e.currentTarget.style.borderColor = "#E07A5F")}
          onMouseOut={e => (e.currentTarget.style.borderColor = "#E8E8E8")}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <p style={{ color: "#ccc", fontSize: 12, textAlign: "center", marginTop: 16 }}>Free • No credit card required</p>
      </div>
    </div>
  );

  // ─── Profile setup screen ────────────────────────────────────────
  if (!profileSaved) return (
    <div style={{ minHeight: "100vh", background: "#FFF9F5", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ background: "white", padding: "16px 24px", borderBottom: "1px solid #F0F0F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 24 }}>👶</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: "#2D2D2D" }}>AskNeer</span>
        </div>
        <button onClick={() => signOut()} style={{ background: "none", border: "1px solid #E8E8E8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "#888", fontSize: 13 }}>Sign out</button>
      </div>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
        <div style={{ background: "white", borderRadius: 20, padding: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", marginTop: 24 }}>
          <h2 style={{ margin: "0 0 4px", color: "#2D2D2D", fontSize: 22 }}>Tell me about your child</h2>
          <p style={{ color: "#888", margin: "0 0 24px", fontSize: 14 }}>Hi {session.user?.name?.split(" ")[0]}! I'll personalize everything for your little one.</p>
          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Child's name</span>
            <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="e.g. Aarav" style={{ width: "100%", padding: "12px 14px", border: "2px solid #F0F0F0", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "#E07A5F"}
              onBlur={e => e.target.style.borderColor = "#F0F0F0"} />
          </label>
          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Date of birth</span>
            <input type="date" value={profile.dob} onChange={e => setProfile({...profile, dob: e.target.value})} style={{ width: "100%", padding: "12px 14px", border: "2px solid #F0F0F0", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "#E07A5F"}
              onBlur={e => e.target.style.borderColor = "#F0F0F0"} />
          </label>
          <label style={{ display: "block", marginBottom: 24 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Anything I should know? <span style={{ fontWeight: 400, color: "#aaa" }}>(optional)</span></span>
            <textarea value={profile.notes} onChange={e => setProfile({...profile, notes: e.target.value})} placeholder="e.g. premature birth, allergies, started daycare..." rows={3} style={{ width: "100%", padding: "12px 14px", border: "2px solid #F0F0F0", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "none" }}
              onFocus={e => e.target.style.borderColor = "#E07A5F"}
              onBlur={e => e.target.style.borderColor = "#F0F0F0"} />
          </label>
          <button onClick={saveProfile} style={{ width: "100%", padding: "14px", background: "#E07A5F", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Start Chatting →
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Main chat screen ────────────────────────────────────────────
  return (
    <div style={{ height: "100vh", background: "#FFF9F5", fontFamily: "'Segoe UI', sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ background: "white", padding: "12px 20px", borderBottom: "1px solid #F0F0F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#FFF0E8", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👶</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#2D2D2D" }}>{profile.name}</div>
            <div style={{ fontSize: 12, color: "#E07A5F", fontWeight: 600 }}>{getAge(profile.dob)}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setShowProModal(true)}
            style={{ background: "none", border: "1px solid #E8E8E8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "#888", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}
          >
            + New Child <span style={{ fontSize: 11, background: "#FFF0E8", color: "#E07A5F", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>PRO</span>
          </button>
          <button onClick={() => signOut()} style={{ background: "none", border: "1px solid #E8E8E8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "#888", fontSize: 13 }}>Sign out</button>
        </div>
      </div>

      {/* Pro gate modal */}
      {showProModal && (
        <div onClick={() => setShowProModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#FFF9F5", borderRadius: 20, padding: 28, maxWidth: 360, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⭐</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, color: "#2D2D2D" }}>Multiple children is a Pro feature</h2>
            <p style={{ color: "#888", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
              Upgrade to AskNeer Pro to add more children, each with their own personalized chat, vaccines, and milestones.
            </p>
            <button onClick={() => { alert("Coming soon! We'll notify you when Pro launches."); setShowProModal(false); }} style={{ width: "100%", padding: "14px", background: "#E07A5F", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 10 }}>
              Upgrade to Pro — $4.99/mo
            </button>
            <button onClick={() => setShowProModal(false)} style={{ width: "100%", padding: "12px", background: "none", color: "#aaa", border: "none", fontSize: 14, cursor: "pointer" }}>
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {messages.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
          <h2 style={{ color: "#2D2D2D", margin: "0 0 8px", fontSize: 22 }}>Hi! I'm AskNeer</h2>
          <p style={{ color: "#888", margin: "0 0 32px", fontSize: 15, textAlign: "center", maxWidth: 400 }}>
            Ask me anything about {profile.name}'s health, sleep, feeding, development, or behavior.
          </p>

          {/* Vaccine button above input — empty state */}
          <div style={{ width: "100%", maxWidth: 600, marginBottom: 10 }}>
            <button
              onClick={() => setShowVaccines(true)}
              style={{ width: "100%", padding: "12px 16px", background: "white", border: "1.5px solid #E07A5F", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#E07A5F", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              💉 View {profile.name}'s Vaccine Schedule
            </button>
          </div>

          <div style={{ width: "100%", maxWidth: 600, display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); }}} rows={2} placeholder={`Ask about ${profile.name}...`} style={{ flex: 1, padding: "14px 16px", border: "2px solid #F0F0F0", borderRadius: 16, fontSize: 15, outline: "none", fontFamily: "inherit", resize: "none", lineHeight: 1.5, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
              onFocus={e => e.target.style.borderColor = "#E07A5F"}
              onBlur={e => e.target.style.borderColor = "#F0F0F0"} />
            <button onClick={ask} disabled={chatLoading || !input.trim()} style={{ background: "#E07A5F", color: "white", border: "none", borderRadius: 14, width: 50, height: 50, cursor: "pointer", fontSize: 20, flexShrink: 0, opacity: chatLoading || !input.trim() ? 0.5 : 1 }}>↑</button>
          </div>
        </div>
      ) : (
        <>
          {/* Chat messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              {messages.map((m, i) => (
                <div key={i} style={{ marginBottom: 16, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  {m.role === "assistant" && (
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FFF0E8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginRight: 10, flexShrink: 0, marginTop: 2 }}>👶</div>
                  )}
                  <div style={{ background: m.role === "user" ? "#E07A5F" : "white", color: m.role === "user" ? "white" : "#2D2D2D", padding: "12px 16px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", maxWidth: "72%", fontSize: 15, lineHeight: 1.7, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FFF0E8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👶</div>
                  <div style={{ background: "white", padding: "12px 16px", borderRadius: "18px 18px 18px 4px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", gap: 4, alignItems: "center" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#E07A5F", opacity: 0.4 }} />
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#E07A5F", opacity: 0.6 }} />
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#E07A5F", opacity: 0.9 }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom input with vaccine button above it */}
          <div style={{ background: "white", borderTop: "1px solid #F0F0F0", padding: "10px 16px 12px" }}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              {/* Vaccine button above input */}
              <button
                onClick={() => setShowVaccines(true)}
                style={{ width: "100%", marginBottom: 8, padding: "9px 16px", background: "#FFF0E8", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#E07A5F", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                💉 {profile.name}'s Vaccine Schedule
              </button>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); }}} rows={2} placeholder={`Ask about ${profile.name}...`} style={{ flex: 1, padding: "12px 14px", border: "2px solid #F0F0F0", borderRadius: 12, fontSize: 15, outline: "none", fontFamily: "inherit", resize: "none", lineHeight: 1.5 }}
                  onFocus={e => e.target.style.borderColor = "#E07A5F"}
                  onBlur={e => e.target.style.borderColor = "#F0F0F0"} />
                <button onClick={ask} disabled={chatLoading || !input.trim()} style={{ background: "#E07A5F", color: "white", border: "none", borderRadius: 12, width: 46, height: 46, cursor: "pointer", fontSize: 20, flexShrink: 0, opacity: chatLoading || !input.trim() ? 0.5 : 1 }}>↑</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Vaccine Tracker fullscreen */}
      {showVaccines && (
        <VaccineTracker
          email={session?.user?.email || ''}
          childName={profile.name}
          childDob={profile.dob}
          onClose={() => setShowVaccines(false)}
        />
      )}
    </div>
  );
}
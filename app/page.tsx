"use client";
import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import VaccineTracker from "@/components/VaccineTracker";
import ChildSnapshot from "@/components/ChildSnapshot";
import InstallPrompt from "@/components/InstallPrompt";

export default function Home() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState({ name: "", dob: "", notes: "", child_id: "" });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [proModalReason, setProModalReason] = useState<'questions' | 'vaccine' | 'newchild'>('newchild');
  const [showVaccines, setShowVaccines] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfile, setEditProfile] = useState({ name: "", dob: "", notes: "" });
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [memories, setMemories] = useState<string[]>([]);
  const [nextVaccine, setNextVaccine] = useState<{name: string, due_date: string} | null>(null);

  function handleNewChild() {
    setProfile({ name: "", dob: "", notes: "", child_id: "" });
    setMessages([]);
    setProfileSaved(false);
  }

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      window.history.replaceState({}, "", "/");
      setTimeout(() => loadProfile(), 2000);
    }
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
      setProfile({
        name: data.profile.child_name,
        dob: data.profile.child_dob,
        notes: data.profile.child_notes || "",
        child_id: data.profile.child_id
      });
      setProfileSaved(true);
      setIsPro(data.profile.is_pro || false);
    }
    if (data.children) {
      setChildren(data.children);
    }
    const chatRes = await fetch(`/api/messages?email=${session.user.email}`);
    const chatData = await chatRes.json();
    if (chatData.messages?.length > 0) {
      setMessages(chatData.messages);
    }
    // Fetch memories for snapshot
    const memRes = await fetch(`/api/memories?email=${session.user.email}`);
    const memData = await memRes.json();
    if (memData.memories) setMemories(memData.memories);

    // Fetch next upcoming vaccine
    const vacRes = await fetch(`/api/vaccines?email=${encodeURIComponent(session.user.email)}&child_name=${encodeURIComponent(data.profile?.child_name || '')}&dob=${data.profile?.child_dob || ''}`);
    const vacData = await vacRes.json();
    if (vacData.vaccines) {
      const today = new Date();
      const upcoming = vacData.vaccines
        .filter((v: any) => !v.completed && new Date(v.due_date) >= today)
        .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
      if (upcoming.length > 0) setNextVaccine(upcoming[0]);
    }
    setProfileLoading(false);
  }

  async function saveProfileToDB(p: typeof profile) {
    if (!session?.user?.email) return;
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: session.user.email,
        child_name: p.name,
        child_dob: p.dob,
        child_notes: p.notes,
        child_id: p.child_id || null
      })
    });
  }

  async function switchChild(child: any) {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: session?.user?.email,
        child_id: child.child_id
      })
    });
    setProfile({
      name: child.child_name,
      dob: child.child_dob,
      notes: child.child_notes || "",
      child_id: child.child_id
    });
    setMessages([]);
    setShowChildPicker(false);
    const chatRes = await fetch(`/api/messages?email=${session?.user?.email}`);
    const chatData = await chatRes.json();
    if (chatData.messages?.length > 0) {
      setMessages(chatData.messages);
    }
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
    if (!isPro && storedDate === today && storedCount >= 3) {
      setProModalReason('questions');
      setShowProModal(true);
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

    // Refresh memories after extraction completes in background
    setTimeout(async () => {
      const memRes = await fetch(`/api/memories?email=${session?.user?.email}&child_name=${encodeURIComponent(profile.name)}`);
      const memData = await memRes.json();
      if (memData.memories) setMemories(memData.memories);
    }, 8000);
  }

  // ─── Login screen ───────────────────────────────────────────────
  if (!session) return (
    <div style={{ minHeight: "100vh", background: "#FFF9F5", fontFamily: "'Segoe UI', sans-serif" }}>
      <InstallPrompt />

      {/* Nav */}
      <div style={{ background: "white", borderBottom: "1px solid #F0EDED", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "#E07A5F", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 15 }}>N</div>
          <span style={{ fontWeight: 800, fontSize: 20, color: "#2D2D2D" }}>AskNeer</span>
        </div>
        <button onClick={() => signIn("google")} style={{ background: "#E07A5F", color: "white", border: "none", borderRadius: 20, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Start Free
        </button>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px 64px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FFF0E8", border: "1px solid #F4C5B4", borderRadius: 99, padding: "6px 16px", marginBottom: 28, fontSize: 13, fontWeight: 600, color: "#E07A5F" }}>
          ✨ From the team behind NeernMom
        </div>

        <h1 style={{ fontSize: "clamp(36px, 6vw, 58px)", fontWeight: 800, color: "#2D2D2D", margin: "0 0 16px", lineHeight: 1.1, letterSpacing: -1.5 }}>
          Every question.<br />
          Every milestone.<br />
          <span style={{ color: "#E07A5F" }}>Every stage of childhood.</span>
        </h1>

        <p style={{ fontSize: 19, color: "#555", lineHeight: 1.75, margin: "0 0 12px", maxWidth: 560, marginLeft: "auto", marginRight: "auto", fontWeight: 400 }}>
          The AI that grows with your child, every step of the way.
        </p>

        <p style={{ fontSize: 15, color: "#888", lineHeight: 1.7, margin: "0 0 40px", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
          One place for every question, every memory, and every milestone your child will ever have.
        </p>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <button onClick={() => signIn("google")} style={{ background: "#E07A5F", color: "white", border: "none", borderRadius: 16, padding: "18px 40px", fontSize: 17, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 6px 24px rgba(224,122,95,0.35)" }}
            onMouseOver={e => (e.currentTarget.style.background = "#D06A4F")}
            onMouseOut={e => (e.currentTarget.style.background = "#E07A5F")}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Start Free with Google
          </button>
          <p style={{ color: "#bbb", fontSize: 13 }}>No credit card required · 3 free questions every day</p>
        </div>
      </div>

      {/* Emotional hook */}
      <div style={{ background: "white", borderTop: "1px solid #F0EDED", borderBottom: "1px solid #F0EDED", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "#2D2D2D", letterSpacing: -0.5 }}>
          Never forget another milestone. Never wonder alone.
        </p>
        <p style={{ margin: 0, fontSize: 15, color: "#888" }}>
          AskNeer remembers your child's journey and gives personalized guidance whenever you need it.
        </p>
      </div>

      {/* Social proof */}
      <div style={{ background: "#FFF9F5", padding: "16px 24px", textAlign: "center", borderBottom: "1px solid #F0EDED" }}>
        <p style={{ margin: 0, color: "#888", fontSize: 14 }}>
          Built by the team behind <strong style={{ color: "#2D2D2D" }}>NeernMom</strong> - trusted by thousands of parents worldwide 🇺🇸 🇬🇧 🇵🇭
        </p>
      </div>

      {/* Problem section */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "72px 24px 48px", textAlign: "center" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#E07A5F", letterSpacing: 2, textTransform: "uppercase", margin: "0 0 16px" }}>Sound familiar?</p>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#2D2D2D", margin: "0 0 48px", lineHeight: 1.2, letterSpacing: -0.5 }}>
          Every parent asks the same questions at 3am.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
          {[
            { q: "My baby has a fever.", sub: "Is this serious?" },
            { q: "Why isn't she sleeping?", sub: "What am I doing wrong?" },
            { q: "Is this normal?", sub: "Should I be worried?" },
            { q: "Did I forget the vaccine?", sub: "What's due next?" },
          ].map(item => (
            <div key={item.q} style={{ background: "white", border: "1px solid #F0EDED", borderRadius: 14, padding: "20px 16px", textAlign: "left" }}>
              <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 15, color: "#2D2D2D" }}>{item.q}</p>
              <p style={{ margin: 0, fontSize: 13, color: "#aaa" }}>{item.sub}</p>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 32, fontSize: 16, color: "#555", lineHeight: 1.7 }}>
          AskNeer doesn't give you generic answers.<br />
          It knows <strong style={{ color: "#2D2D2D" }}>your child</strong> - their age, history, allergies, milestones - and answers accordingly.
        </p>
      </div>
      {/* Meet Emma — How it works */}
      <style>{`
        @media (max-width: 640px) {
          .emma-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ background: "white", borderTop: "1px solid #F0EDED", padding: "72px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#E07A5F", letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px", textAlign: "center" }}>See it in action</p>
          <h2 style={{ textAlign: "center", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#2D2D2D", margin: "0 0 12px", lineHeight: 1.2, letterSpacing: -0.5 }}>
            This is why AskNeer isn't ChatGPT.
          </h2>
          <p style={{ textAlign: "center", color: "#888", margin: "0 0 48px", fontSize: 15, lineHeight: 1.6 }}>
            AskNeer knows your child before you even ask the question.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

            {/* Child profile card */}
            <div style={{ background: "#FFF9F5", border: "1.5px solid #F0EDED", borderRadius: 20, padding: "24px", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "#E07A5F", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 18 }}>E</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#2D2D2D" }}>Emma</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#E07A5F", fontWeight: 600 }}>8 months old</p>
                </div>
                <div style={{ marginLeft: "auto", background: "#E07A5F", color: "white", fontSize: 10, fontWeight: 700, borderRadius: 6, padding: "3px 8px" }}>AskNeer knows</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: "🌙", label: "Last night's sleep", value: "7 hours" },
                  { icon: "🍎", label: "Started solids", value: "3 weeks ago" },
                  { icon: "⚠️", label: "Egg allergy", value: "Recorded" },
                  { icon: "💉", label: "Last vaccine", value: "2 weeks ago" },
                  { icon: "📏", label: "Weight", value: "7.8 kg" },
                  { icon: "💬", label: "Previous chats", value: "12 conversations" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "white", borderRadius: 10, border: "1px solid #F0EDED" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15 }}>{item.icon}</span>
                      <span style={{ fontSize: 13, color: "#666" }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat demo */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Chat label */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ height: 1, flex: 1, background: "#F0EDED" }} />
                <span style={{ fontSize: 12, color: "#aaa", fontWeight: 500 }}>Parent asks</span>
                <div style={{ height: 1, flex: 1, background: "#F0EDED" }} />
              </div>

              {/* Parent message */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ background: "#E07A5F", color: "white", padding: "12px 16px", borderRadius: "18px 18px 4px 18px", maxWidth: "80%", fontSize: 14, lineHeight: 1.6, boxShadow: "0 2px 8px rgba(224,122,95,0.2)" }}>
                  Is it okay that Emma skipped breakfast today?
                </div>
              </div>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ height: 1, flex: 1, background: "#F0EDED" }} />
                <span style={{ fontSize: 12, color: "#aaa", fontWeight: 500 }}>AskNeer responds</span>
                <div style={{ height: 1, flex: 1, background: "#F0EDED" }} />
              </div>

              {/* AskNeer response */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ background: "#E07A5F", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>E</div>
                <div style={{ background: "white", border: "1px solid #F0EDED", padding: "14px 16px", borderRadius: "4px 18px 18px 18px", fontSize: 14, lineHeight: 1.7, color: "#2D2D2D", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  Since Emma only started solids <strong>3 weeks ago</strong>, skipping a meal is completely normal at this stage — her tummy is still adjusting. Given her <strong>recorded egg allergy</strong>, I'd also suggest watching any new foods you introduce this week. At 8 months, breast milk or formula still provides most of her nutrition, so don't worry too much about one missed breakfast.
                  <div style={{ marginTop: 10, padding: "8px 12px", background: "#FFF9F5", borderRadius: 8, fontSize: 12, color: "#E07A5F", fontWeight: 600 }}>
                    💡 Based on Emma's profile — not a generic answer
                  </div>
                </div>
              </div>

              {/* VS ChatGPT */}
              <div style={{ marginTop: 8, padding: "14px 16px", background: "#F9F9F9", border: "1px solid #EEEEEE", borderRadius: 12 }}>
                <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 1 }}>ChatGPT would say:</p>
                <p style={{ margin: 0, fontSize: 13, color: "#aaa", lineHeight: 1.5, fontStyle: "italic" }}>
                  "It's generally normal for babies to occasionally skip meals. Make sure they're getting enough nutrients throughout the day..."
                </p>
                <p style={{ margin: "8px 0 0", fontSize: 11, color: "#ccc" }}>Generic. Doesn't know Emma. Doesn't know about the egg allergy.</p>
              </div>

            </div>
          </div>

          {/* Bottom CTA */}
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <p style={{ color: "#888", fontSize: 15, margin: "0 0 16px" }}>
              AskNeer builds Emma's profile from your conversations — automatically.
            </p>
            <button onClick={() => signIn("google")} style={{ background: "#E07A5F", color: "white", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(224,122,95,0.3)" }}>
              Start building your child's profile →
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ background: "white", borderTop: "1px solid #F0EDED", padding: "72px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#E07A5F", letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px", textAlign: "center" }}>What makes AskNeer different</p>
          <h2 style={{ textAlign: "center", fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 800, color: "#2D2D2D", margin: "0 0 48px", letterSpacing: -0.5 }}>
            Not another AI chatbot. A personalized parenting companion that grows with your child.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {[
              { emoji: "🧠", title: "Remembers everything", desc: "Tell Neer about allergies, milestones, or daycare once - it remembers forever. Every answer gets more personal over time.", pro: false },
              { emoji: "💉", title: "Vaccine tracker", desc: "Automatically calculates your child's complete vaccine schedule from their date of birth. Never miss a due date.", pro: true },
              { emoji: "⏰", title: "Available at 3am", desc: "When your baby won't sleep and you need answers right now - AskNeer is always there. No appointments, no waiting.", pro: false },
              { emoji: "🎯", title: "Knows their exact age", desc: "Every response is calibrated to your child's age in months and years. No generic advice - everything is relevant right now.", pro: false },
              { emoji: "🔒", title: "Private and secure", desc: "Your child's data is yours. We never share it, never sell it. Stored securely and only accessible to you.", pro: false },
              { emoji: "📖", title: "Growing platform", desc: "Sleep tracking, growth charts, milestones, and a lifetime storybook - all coming to AskNeer. Your child's journey, in one place.", pro: false },
            ].map(f => (
              <div key={f.title} style={{ background: "#FFF9F5", borderRadius: 16, padding: "24px 22px", border: "1px solid #F0EDED", position: "relative" }}>
                {f.pro && (
                  <span style={{ position: "absolute", top: 16, right: 16, fontSize: 10, fontWeight: 700, background: "#FFF0E8", color: "#E07A5F", borderRadius: 4, padding: "2px 7px" }}>PRO</span>
                )}
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.emoji}</div>
                <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#2D2D2D" }}>{f.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: "#888", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Early Access - Coming Soon */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "72px 24px" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#E07A5F", letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px", textAlign: "center" }}>Early Access</p>
        <h2 style={{ textAlign: "center", fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 800, color: "#2D2D2D", margin: "0 0 12px", letterSpacing: -0.5 }}>
          The future of AskNeer is being built.
        </h2>
        <p style={{ textAlign: "center", color: "#888", margin: "0 0 40px", fontSize: 15 }}>
          Join the waitlist and be the first to access these features as they launch.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[
            { emoji: "❤️", title: "Child Timeline", desc: "Every important moment, remembered forever. Your child's entire story in one beautiful place.", hot: true },
            { emoji: "🌙", title: "Sleep Tracker", desc: "Understand patterns, not just hours. AI insights that help your child sleep better." },
            { emoji: "🍼", title: "Feeding Journal", desc: "Track nutrition and routines. Never lose track of meals, allergies, or first foods again." },
            { emoji: "📈", title: "Growth & Milestones", desc: "See how your child is developing over time. WHO growth charts and milestone celebrations." },
          ].map(f => (
            <div key={f.title} style={{ background: "white", borderRadius: 16, padding: "24px 20px", border: f.hot ? "1.5px solid #E07A5F" : "1px solid #F0EDED", position: "relative", opacity: 0.92 }}>
              {f.hot && (
                <span style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "#E07A5F", color: "white", fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "3px 12px", whiteSpace: "nowrap" }}>MOST REQUESTED</span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 26 }}>{f.emoji}</span>
                <div style={{ background: "#F5F5F5", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700, color: "#999" }}>EARLY ACCESS</div>
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#2D2D2D" }}>{f.title}</h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888", lineHeight: 1.5 }}>{f.desc}</p>
              <button onClick={() => signIn("google")} style={{ width: "100%", padding: "9px", background: "#FFF0E8", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#E07A5F", cursor: "pointer" }}>
                Get Early Access
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Storybook teaser */}
      <div style={{ background: "linear-gradient(135deg, #E07A5F 0%, #C85A3F 100%)", padding: "72px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "white", margin: "0 0 16px", lineHeight: 1.2, letterSpacing: -0.5 }}>
            Coming: The Storybook
          </h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, lineHeight: 1.75, margin: "0 0 28px" }}>
            Every photo. Every first word. Every milestone. Every growth chart.<br />
            Years later, export <em>The Story of Emma - 0 to 18 years.</em><br />
            Something parents will treasure forever.
          </p>
          <button onClick={() => signIn("google")} style={{ background: "white", color: "#E07A5F", border: "none", borderRadius: 14, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            Start your child's story →
          </button>
        </div>
      </div>

      {/* Pricing */}
      <div style={{ background: "white", padding: "72px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 800, color: "#2D2D2D", margin: "0 0 8px", letterSpacing: -0.5 }}>Simple, honest pricing</h2>
          <p style={{ textAlign: "center", color: "#888", margin: "0 0 40px", fontSize: 15 }}>Start free. Upgrade when you're ready.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {/* Free */}
            <div style={{ border: "1.5px solid #F0EDED", borderRadius: 20, padding: "28px 24px" }}>
              <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 18, color: "#2D2D2D" }}>Free</p>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "#aaa" }}>Forever free, no card needed</p>
              <p style={{ margin: "0 0 24px", fontSize: 36, fontWeight: 800, color: "#2D2D2D" }}>$0<span style={{ fontSize: 16, fontWeight: 400, color: "#aaa" }}>/mo</span></p>
              {["3 questions per day", "Personalized AI answers", "Remembers your child", "Chat history saved"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ color: "#38A169", fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: 14, color: "#555" }}>{f}</span>
                </div>
              ))}
              <button onClick={() => signIn("google")} style={{ marginTop: 20, width: "100%", padding: "12px", background: "#F5F5F5", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, color: "#555", cursor: "pointer" }}>
                Get started free
              </button>
            </div>
            {/* Pro */}
            <div style={{ border: "2px solid #E07A5F", borderRadius: 20, padding: "28px 24px", position: "relative", background: "#FFFAF8" }}>
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#E07A5F", color: "white", fontSize: 12, fontWeight: 700, borderRadius: 99, padding: "4px 16px", whiteSpace: "nowrap" }}>MOST POPULAR</div>
              <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 18, color: "#2D2D2D" }}>Pro</p>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "#aaa" }}>For parents who want more</p>
              <p style={{ margin: "0 0 24px", fontSize: 36, fontWeight: 800, color: "#E07A5F" }}>$4.99<span style={{ fontSize: 16, fontWeight: 400, color: "#aaa" }}>/mo</span></p>
              {["Unlimited questions", "7-day free trial", "Vaccine tracker", "Multiple children profiles", "Early access to all new features", "Everything in Free"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ color: "#E07A5F", fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: 14, color: "#555" }}>{f}</span>
                </div>
              ))}
              <button onClick={() => signIn("google")} style={{ marginTop: 20, width: "100%", padding: "12px", background: "#E07A5F", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, color: "white", cursor: "pointer" }}>
                Start free trial
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div style={{ padding: "72px 24px", textAlign: "center", background: "#FFF9F5" }}>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#2D2D2D", margin: "0 0 12px", letterSpacing: -0.5 }}>
          Start your child's story today.
        </h2>
        <p style={{ color: "#888", fontSize: 16, margin: "0 0 32px", lineHeight: 1.6 }}>
          Join parents across the US, UK, and Philippines<br />who never want to forget a moment.
        </p>
        <button onClick={() => signIn("google")} style={{ background: "#E07A5F", color: "white", border: "none", borderRadius: 14, padding: "18px 40px", fontSize: 17, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 24px rgba(224,122,95,0.35)" }}
          onMouseOver={e => (e.currentTarget.style.background = "#D06A4F")}
          onMouseOut={e => (e.currentTarget.style.background = "#E07A5F")}>
          Start Free - No Card Required
        </button>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #F0EDED", padding: "20px 24px", textAlign: "center" }}>
        <p style={{ margin: 0, color: "#ccc", fontSize: 13 }}>
          © 2026 AskNeer · Powered by NeernMom · <span style={{ color: "#E07A5F" }}>Not a medical service</span>
        </p>
      </div>

    </div>
  );

  // ─── Profile setup screen ────────────────────────────────────────
  if (!profileSaved) return (
    <div style={{ minHeight: "100vh", background: "#FFF9F5", fontFamily: "'Segoe UI', sans-serif" }}>
      <InstallPrompt />
      <div style={{ background: "white", padding: "16px 24px", borderBottom: "1px solid #F0F0F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "#E07A5F", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 15 }}>N</div>
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
      <InstallPrompt />

      {/* Header */}
      <div style={{ background: "white", padding: "12px 20px", borderBottom: "1px solid #F0F0F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

          {/* Avatar - hover shows edit icon, click opens edit panel */}
          <div
            onMouseEnter={() => setAvatarHovered(true)}
            onMouseLeave={() => setAvatarHovered(false)}
            onClick={() => { setEditProfile({ name: profile.name, dob: profile.dob, notes: profile.notes }); setShowEditProfile(true); }}
            style={{ position: "relative", background: "#E07A5F", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 16, cursor: "pointer", flexShrink: 0 }}
          >
            {avatarHovered ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            ) : (
              profile.name?.[0]?.toUpperCase() || "N"
            )}
          </div>

          {/* Child name - tap to switch if multiple children */}
          <div
            onClick={() => children.length > 1 && setShowChildPicker(true)}
            style={{ cursor: children.length > 1 ? "pointer" : "default" }}
          >
            <div style={{ fontWeight: 700, fontSize: 15, color: "#2D2D2D", display: "flex", alignItems: "center", gap: 4 }}>
              {profile.name}
              {children.length > 1 && <span style={{ fontSize: 10, color: "#aaa" }}>▼</span>}
            </div>
            <div style={{ fontSize: 12, color: "#E07A5F", fontWeight: 600 }}>{getAge(profile.dob)}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => isPro ? handleNewChild() : (() => { setProModalReason('newchild'); setShowProModal(true); })()}
            style={{ background: "none", border: "1px solid #E8E8E8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "#888", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}
          >
            + New Child <span style={{ fontSize: 11, background: "#FFF0E8", color: "#E07A5F", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>PRO</span>
          </button>
          <button onClick={() => signOut()} style={{ background: "none", border: "1px solid #E8E8E8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "#888", fontSize: 13 }}>Sign out</button>
        </div>
      </div>
      
      {/* Child Snapshot bar */}
      {profileSaved && (
        <ChildSnapshot
          name={profile.name}
          dob={profile.dob}
          memories={memories}
          nextVaccine={nextVaccine}
          getAge={getAge}
        />
      )}

      {/* Pro gate modal */}
      {showProModal && (
        <div onClick={() => setShowProModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#FFF9F5", borderRadius: 20, padding: 28, maxWidth: 360, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>
              {proModalReason === 'questions' ? '💬' : '⭐'}
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, color: "#2D2D2D" }}>
              {proModalReason === 'questions' && "You've used your 3 free questions today"}
              {proModalReason === 'vaccine' && "Vaccine tracker is a Pro feature"}
              {proModalReason === 'newchild' && "Multiple children is a Pro feature"}
            </h2>
            <p style={{ color: "#888", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
              {proModalReason === 'questions' && "Upgrade to AskNeer Pro for unlimited questions, vaccine tracking, and multiple children profiles - all personalized to your child."}
              {proModalReason === 'vaccine' && "Upgrade to AskNeer Pro to unlock vaccine tracking, add multiple children, and get unlimited questions - all personalized to your child."}
              {proModalReason === 'newchild' && "Upgrade to AskNeer Pro to add more children, each with their own personalized chat, vaccines, and milestones."}
            </p>
            <button onClick={async () => {
              const res = await fetch("/api/lemon/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: session?.user?.email, name: session?.user?.name }),
              });
              const data = await res.json();
              if (data.url) {
                window.location.href = data.url;
              } else {
                alert("Something went wrong. Please try again.");
              }
            }} style={{ width: "100%", padding: "14px", background: "#E07A5F", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 10 }}>
              Upgrade to Pro - $4.99/mo
            </button>
            <button onClick={() => setShowProModal(false)} style={{ width: "100%", padding: "12px", background: "none", color: "#aaa", border: "none", fontSize: 14, cursor: "pointer" }}>
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Panel - correctly outside Pro modal */}
      {showEditProfile && (
        <div onClick={() => setShowEditProfile(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 3000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#FFF9F5", borderRadius: "20px 20px 0 0", padding: "24px 24px 36px", width: "100%", maxWidth: 480 }}>
            <div style={{ width: 40, height: 4, background: "#E0D8D4", borderRadius: 99, margin: "0 auto 20px" }} />
            <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: "#2D2D2D" }}>Edit {profile.name}'s profile</h3>
            <label style={{ display: "block", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Child's name</span>
              <input value={editProfile.name} onChange={e => setEditProfile({...editProfile, name: e.target.value})} style={{ width: "100%", padding: "12px 14px", border: "2px solid #F0F0F0", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                onFocus={e => e.target.style.borderColor = "#E07A5F"}
                onBlur={e => e.target.style.borderColor = "#F0F0F0"} />
            </label>
            <label style={{ display: "block", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Date of birth</span>
              <input type="date" value={editProfile.dob} onChange={e => setEditProfile({...editProfile, dob: e.target.value})} style={{ width: "100%", padding: "12px 14px", border: "2px solid #F0F0F0", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                onFocus={e => e.target.style.borderColor = "#E07A5F"}
                onBlur={e => e.target.style.borderColor = "#F0F0F0"} />
            </label>
            <label style={{ display: "block", marginBottom: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Notes <span style={{ fontWeight: 400, color: "#aaa" }}>(optional)</span></span>
              <textarea value={editProfile.notes} onChange={e => setEditProfile({...editProfile, notes: e.target.value})} rows={3} style={{ width: "100%", padding: "12px 14px", border: "2px solid #F0F0F0", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "none" }}
                onFocus={e => e.target.style.borderColor = "#E07A5F"}
                onBlur={e => e.target.style.borderColor = "#F0F0F0"} />
            </label>
            <button onClick={async () => {
              await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: session?.user?.email,
                  child_name: editProfile.name,
                  child_dob: editProfile.dob,
                  child_notes: editProfile.notes,
                  child_id: profile.child_id
                })
              });
              setProfile({ ...profile, name: editProfile.name, dob: editProfile.dob, notes: editProfile.notes });
              setShowEditProfile(false);
            }} style={{ width: "100%", padding: 14, background: "#E07A5F", color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Save changes
            </button>
          </div>
        </div>
      )}

      {/* Child Picker - correctly outside Pro modal */}
      {showChildPicker && (
        <div onClick={() => setShowChildPicker(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 3000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#FFF9F5", borderRadius: "20px 20px 0 0", padding: "24px 24px 36px", width: "100%", maxWidth: 480 }}>
            <div style={{ width: 40, height: 4, background: "#E0D8D4", borderRadius: 99, margin: "0 auto 20px" }} />
            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700, color: "#2D2D2D" }}>Switch child</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {children.map(child => (
                <div
                  key={child.child_id}
                  onClick={() => switchChild(child)}
                  style={{
                    padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                    background: child.child_id === profile.child_id ? "#FFF0E8" : "white",
                    border: child.child_id === profile.child_id ? "2px solid #E07A5F" : "1px solid #F0F0F0",
                    display: "flex", alignItems: "center", gap: 12
                  }}
                >
                  <div style={{ background: "#E07A5F", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 15 }}>
                    {child.child_name?.[0]?.toUpperCase() || "N"}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "#2D2D2D" }}>{child.child_name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#999" }}>{getAge(child.child_dob)}</p>
                  </div>
                  {child.child_id === profile.child_id && (
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "#E07A5F", fontWeight: 600 }}>Active</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {messages.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#E07A5F", borderRadius: "50%", width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 28, marginBottom: 16 }}>
            {profile.name?.[0]?.toUpperCase() || "N"}
          </div>
          <h2 style={{ color: "#2D2D2D", margin: "0 0 8px", fontSize: 22 }}>Hi! I'm AskNeer</h2>
          <p style={{ color: "#888", margin: "0 0 32px", fontSize: 15, textAlign: "center", maxWidth: 400 }}>
            Ask me anything about {profile.name}'s health, sleep, feeding, development, or behavior.
          </p>
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => isPro ? setShowVaccines(true) : (() => { setProModalReason('vaccine'); setShowProModal(true); })()}
              style={{ background: "#FFF0E8", border: "none", borderRadius: 20, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#E07A5F", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              💉 Vaccine Schedule <span style={{ fontSize: 10, background: "#E07A5F", color: "white", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>PRO</span>
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
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E07A5F", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 14, marginRight: 10, flexShrink: 0, marginTop: 2 }}>
                      {profile.name?.[0]?.toUpperCase() || "N"}
                    </div>
                  )}
                  <div style={{ background: m.role === "user" ? "#E07A5F" : "white", color: m.role === "user" ? "white" : "#2D2D2D", padding: "12px 16px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", maxWidth: "72%", fontSize: 15, lineHeight: 1.7, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E07A5F", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 14 }}>
                    {profile.name?.[0]?.toUpperCase() || "N"}
                  </div>
                  <div style={{ background: "white", padding: "12px 16px", borderRadius: "18px 18px 18px 4px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", gap: 4, alignItems: "center" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#E07A5F", opacity: 0.4 }} />
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#E07A5F", opacity: 0.6 }} />
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#E07A5F", opacity: 0.9 }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom input */}
          <div style={{ background: "white", borderTop: "1px solid #F0F0F0", padding: "10px 16px 12px" }}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <div style={{ marginBottom: 8 }}>
                <button
                  onClick={() => isPro ? setShowVaccines(true) : (() => { setProModalReason('vaccine'); setShowProModal(true); })()}
                  style={{ background: "#FFF0E8", border: "none", borderRadius: 20, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#E07A5F", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  💉 Vaccine Schedule <span style={{ fontSize: 10, background: "#E07A5F", color: "white", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>PRO</span>
                </button>
              </div>
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

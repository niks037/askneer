"use client";
import { useState, useEffect, useRef } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import VaccineTracker from "@/components/VaccineTracker";
import ChildSnapshot from "@/components/ChildSnapshot";
import InstallPrompt from "@/components/InstallPrompt";
import LandingHub from "@/components/LandingHub";
import MemoryView from "@/components/MemoryView";
import SleepCoach from "@/components/SleepCoach";
import DailyCheckin from "@/components/DailyCheckin";

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
  const [proModalReason, setProModalReason] = useState<'questions' | 'vaccine'>('questions');
  const [showVaccines, setShowVaccines] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfile, setEditProfile] = useState({ name: "", dob: "", notes: "" });
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [memories, setMemories] = useState<{memory: string, source?: string}[]>([]);
  const [nextVaccine, setNextVaccine] = useState<{name: string, due_date: string} | null>(null);
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const [profileError, setProfileError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [newMemories, setNewMemories] = useState<string[]>([]);
  const [showMemoryView, setShowMemoryView] = useState(false);
  const [showSleepCoach, setShowSleepCoach] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinDoneToday, setCheckinDoneToday] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);


  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      window.history.replaceState({}, "", "/");
      setShowUpgradeSuccess(true);
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        await loadProfile();
        if (attempts >= 8) {
          if (pollRef.current) clearInterval(pollRef.current);
          setShowUpgradeSuccess(false);
        }
      }, 3000);
    }
  }, []);

  useEffect(() => {
    if (isPro && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [isPro]);

  useEffect(() => {
    if (session?.user?.email) {
      loadProfile();
    } else if (status === "unauthenticated") {
      setProfileLoading(false);
    }
  }, [session?.user?.email, status]);

  if (!mounted || profileLoading) return (
    <div style={{ minHeight: "100vh", background: "#FFF9F5", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ color: "#E07A5F", fontSize: 16, fontFamily: "'Segoe UI', sans-serif" }}>Loading...</div>
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

  function getMonthsOld(dob: string) {
    if (!dob) return 12;
    const birth = new Date(dob);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    return Math.max(0, Math.min(36, months));
  }

  async function loadProfile() {
    if (!session?.user?.email) {
      setProfileLoading(false);
      return;
    }
    const res = await fetch(`/api/profile`);
    const data = await res.json();
    const isProUser = data.profile?.is_pro || false;
    if (data.profile) {
      setProfile({
        name: data.profile.child_name,
        dob: data.profile.child_dob,
        notes: data.profile.child_notes || "",
        child_id: data.profile.child_id
      });
      setProfileSaved(true);
      setIsPro(isProUser);
    }
    if (data.children) {
      setChildren(data.children);
    }
    const chatRes = await fetch(`/api/messages`);
    const chatData = await chatRes.json();
    if (chatData.messages?.length > 0) {
      setMessages(chatData.messages);
    }
    const memRes = await fetch(`/api/memories?child_name=${encodeURIComponent(data.profile?.child_name || '')}`);
    const memData = await memRes.json();
    if (memData.memories) setMemories(memData.memories);
    const checkinRes = await fetch(`/api/checkin?child_name=${encodeURIComponent(data.profile?.child_name || '')}`);
    const checkinData = await checkinRes.json();
    setCheckinDoneToday(checkinData.done_today);
    if (!checkinData.done_today) {
      const skippedToday = localStorage.getItem(`askneer_checkin_skipped_${new Date().toDateString()}`);
      if (!skippedToday) {
        setTimeout(() => setShowCheckin(true), 2000);
      }
    }
    if (isProUser) {
      const vacRes = await fetch(`/api/vaccines?child_name=${encodeURIComponent(data.profile?.child_name || '')}&dob=${data.profile?.child_dob || ''}`);
      const vacData = await vacRes.json();
      if (vacData.vaccines) {
        const today = new Date();
        const upcoming = vacData.vaccines
          .filter((v: any) => !v.completed && new Date(v.due_date) >= today)
          .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        if (upcoming.length > 0) setNextVaccine(upcoming[0]);
      }
    } else {
      setNextVaccine(null);
    }
    setProfileLoading(false);
  }

  async function saveProfileToDB(p: typeof profile) {
    if (!session?.user?.email) return;
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
      body: JSON.stringify({ child_id: child.child_id })
    });
    setProfile({ name: child.child_name, dob: child.child_dob, notes: child.child_notes || "", child_id: child.child_id });
    setMessages([]);
    setShowChildPicker(false);
    const chatRes = await fetch(`/api/messages`);
    const chatData = await chatRes.json();
    if (chatData.messages?.length > 0) setMessages(chatData.messages);
  }

  async function deleteMemory(memory: string) {
    await fetch("/api/memories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ child_name: profile.name, memory_text: memory })
    });
    setMemories(prev => prev.filter(m => m.memory !== memory));
  }
  
  async function confirmMemory(oldMemory: string, newMemory?: string) {
    await fetch("/api/memories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        child_name: profile.name,
        old_memory: oldMemory,
        new_memory: newMemory || oldMemory
      })
    });
    setMemories(prev => prev.map(m =>
      m.memory === oldMemory
        ? { memory: newMemory || oldMemory, source: 'parent' }
        : m
    ));
  }

  function saveProfile() {
    if (!profile.name || !profile.dob) {
      setProfileError("Please enter your child's name and date of birth.");
      return;
    }
    setProfileError("");
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
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, history: updatedMessages })
      });
      if (res.status === 403) {
        const data = await res.json();
        if (data.error === "limit_reached") {
          setProModalReason('questions');
          setShowProModal(true);
          setMessages(updatedMessages.slice(0, -1));
          setInput(input);
          setChatLoading(false);
          return;
        }
        throw new Error("API error");
      }
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (!data.reply) throw new Error("No reply");
      setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setMessages([...updatedMessages, {
        role: "assistant",
        content: "Something went wrong - your question wasn't lost. Please try again."
      }]);
    } finally {
      setChatLoading(false);
    }
    const previousMemories = new Set(memories.map(m => m.memory));
    [8000, 16000].forEach(delay => {
      setTimeout(async () => {
        const memRes = await fetch(`/api/memories?child_name=${encodeURIComponent(profile.name)}`);
        const memData = await memRes.json();
        if (memData.memories) {
          setMemories(memData.memories);
          const added = memData.memories.filter((m: any) => !previousMemories.has(m.memory));
          if (added.length > 0) {
            setNewMemories(added.map((m: any) => m.memory));
            setTimeout(() => setNewMemories([]), 6000);
          }
        }
      }, delay);
    });
  }

  // ─── Login screen ───────────────────────────────────────────────
  if (!session) return <LandingHub onGoogle={() => signIn("google")} />;

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
            <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="e.g. Emma, Lucas, Sofia" style={{ width: "100%", padding: "12px 14px", border: "2px solid #F0F0F0", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "#E07A5F"}
              onBlur={e => e.target.style.borderColor = "#F0F0F0"} />
          </label>
          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Date of birth</span>
            <input type="date" value={profile.dob} onChange={e => setProfile({...profile, dob: e.target.value})} style={{ width: "100%", padding: "12px 14px", border: "2px solid #F0F0F0", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "white", color: "#2D2D2D", WebkitAppearance: "none" as any }}
              onFocus={e => e.target.style.borderColor = "#E07A5F"}
              onBlur={e => e.target.style.borderColor = "#F0F0F0"} />
          </label>
          <label style={{ display: "block", marginBottom: 24 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>What should AskNeer know about your child? <span style={{ fontWeight: 400, color: "#aaa" }}>(optional)</span></span>
            <textarea value={profile.notes} onChange={e => setProfile({...profile, notes: e.target.value})} placeholder="allergies · health conditions · sleep struggles · feeding · anything you're worried about" rows={3} style={{ width: "100%", padding: "12px 14px", border: "2px solid #F0F0F0", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "none" }}
              onFocus={e => e.target.style.borderColor = "#E07A5F"}
              onBlur={e => e.target.style.borderColor = "#F0F0F0"} />
          </label>
          {/* Privacy note under notes field */}
          <div style={{ background: "#F8F8F8", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#888", display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span>🔒</span>
            <span>Your child's information personalizes AskNeer's responses. We don't sell it or use it for advertising. <a href="/privacy" style={{ color: "#E07A5F" }}>How we handle your child's data →</a></span>
          </div>

          {/* Consent checkbox */}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={e => setConsentChecked(e.target.checked)}
              style={{ marginTop: 3, flexShrink: 0, accentColor: "#E07A5F", width: 16, height: 16 }}
            />
            <span style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>
              I am 18 or older and the parent or legal guardian of this child. I understand that AskNeer will use the information I provide to personalize its responses.
            </span>
          </label>

          {profileError && (
            <div style={{ background: "#FFF0E8", border: "1px solid #F4C5B4", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#993C1D" }}>
              {profileError}
            </div>
          )}
          <button onClick={saveProfile} disabled={!consentChecked} style={{ width: "100%", padding: "14px", background: "#E07A5F", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: !consentChecked ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: !consentChecked ? 0.6 : 1 }}>
            Start Chatting
          </button>
        </div>
      </div>
    </div>
  );

  <button
  onClick={async () => {
    if (confirm("Are you sure? This will permanently delete your account, child profile, chat history, memories, and vaccine records. This cannot be undone.")) {
      await fetch("/api/account", { method: "DELETE" });
      signOut();
    }
  }}
  style={{ background: "none", border: "none", color: "#ddd", fontSize: 11, cursor: "pointer", textDecoration: "underline" }}
>
  Delete account
</button>

  // ─── Main chat screen ────────────────────────────────────────────
  return (
    <div style={{ height: "100vh", background: "#FFF9F5", fontFamily: "'Segoe UI', sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <InstallPrompt />
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Pro upgrade success banner */}
      {showUpgradeSuccess && (
        <div style={{ background: "#38A169", color: "white", padding: "10px 20px", textAlign: "center", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          🎉 Welcome to AskNeer Pro! Your account is being activated...
          <button onClick={() => setShowUpgradeSuccess(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: 16, marginLeft: 8 }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{ background: "white", padding: "12px 20px", borderBottom: "1px solid #F0F0F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
          <div onClick={() => {}} style={{ cursor: "default" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#2D2D2D", display: "flex", alignItems: "center", gap: 6 }}>
              {profile.name}
              <button
                onClick={() => isPro ? setShowMemoryView(true) : (() => { setProModalReason('questions'); setShowProModal(true); })()}
                title="What AskNeer remembers"
                style={{ background: "#F0FFF4", border: "1px solid #9AE6B4", borderRadius: 99, padding: "2px 8px", fontSize: 11, fontWeight: 600, color: "#276749", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
              >
                🧠 {memories.length}
              </button>
            </div>
            <div style={{ fontSize: 12, color: "#E07A5F", fontWeight: 600 }}>{getAge(profile.dob)}</div>
            {profileSaved && !checkinDoneToday && (
              <button
                onClick={() => setShowCheckin(true)}
                style={{ background: "#FFF0E8", border: "1px solid #F4C5B4", borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 600, color: "#E07A5F", cursor: "pointer", marginTop: 2 }}
              >
                ✓ Daily check-in
              </button>
            )}
            {profileSaved && checkinDoneToday && (
              <span style={{ fontSize: 11, color: "#38A169", fontWeight: 600, marginTop: 2 }}>✓ Checked in</span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isPro && (
            <button
              onClick={async () => {
                const res = await fetch("/api/dodo/portal", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: session?.user?.email }),
                });
                const data = await res.json();
                if (data.url) {
                  window.open(data.url, "_blank");
                } else {
                  alert("Unable to open billing portal. Please contact info@askneer.com");
                }
              }}
              style={{ background: "none", border: "1px solid #E8E8E8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "#888", fontSize: 13 }}
            >
              Manage Plan
            </button>
          )}
          <button onClick={() => signOut()} style={{ background: "none", border: "1px solid #E8E8E8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "#888", fontSize: 13 }}>Sign out</button>
        </div>
      </div>

      {/* Child Snapshot bar */}
      {profileSaved && isPro && (
        <div onClick={() => setShowMemoryView(true)} style={{ cursor: "pointer" }}>
          <ChildSnapshot
            name={profile.name}
            dob={profile.dob}
            memories={memories.map(m => m.memory)}
            nextVaccine={nextVaccine}
            getAge={getAge}
            isPro={isPro}
          />
        </div>
      )}

      {/* Pro gate modal */}
      {showProModal && (
        <div onClick={() => setShowProModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#FFF9F5", borderRadius: 20, padding: 28, maxWidth: 360, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>
              {proModalReason === 'questions' ? '💬' : '⭐'}
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, color: "#2D2D2D" }}>
              {proModalReason === 'questions' && `You've used your free questions today 💛`}
              {proModalReason === 'vaccine' && "Vaccine tracker is a Pro feature"}
            </h2>
            <p style={{ color: "#888", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
              {proModalReason === 'questions' && (
                <div style={{ textAlign: "left" }}>
                  {["Unlimited questions - ask anything, anytime", `${profile.name}'s memories stay with AskNeer`, "Vaccine tracker with full WHO schedule", "7-day free trial - cancel anytime"].map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ color: "#E07A5F", fontWeight: 700 }}>✓</span>
                      <span style={{ fontSize: 14, color: "#555" }}>{f}</span>
                    </div>
                  ))}
                </div>
              )}
              {proModalReason === 'vaccine' && "Upgrade to AskNeer Pro to unlock vaccine tracking and get unlimited questions - all personalized to your child."}
            </p>
            {checkoutError && (
              <div style={{ background: "#FFF0E8", border: "1px solid #F4C5B4", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#993C1D" }}>
                {checkoutError}
              </div>
            )}
            <button onClick={async () => {
              setCheckoutError("");
              const res = await fetch("/api/dodo/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: session?.user?.email, name: session?.user?.name }),
              });
              const data = await res.json();
              if (data.url) {
                window.location.href = data.url;
              } else {
                setCheckoutError("Something went wrong. Please try again.");
              }
            }} style={{ width: "100%", padding: "14px", background: "#E07A5F", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 10 }}>
              Start 7-day free trial, then $4.99/mo
            </button>
            <button onClick={() => setShowProModal(false)} style={{ width: "100%", padding: "12px", background: "none", color: "#aaa", border: "none", fontSize: 14, cursor: "pointer" }}>
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Panel */}
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
              <input type="date" value={editProfile.dob} onChange={e => setEditProfile({...editProfile, dob: e.target.value})} style={{ width: "100%", padding: "12px 14px", border: "2px solid #F0F0F0", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "white", color: "#2D2D2D", WebkitAppearance: "none" as any }}
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

      {/* Child Picker */}
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
          <p style={{ color: "#888", margin: "0 0 24px", fontSize: 15, textAlign: "center", maxWidth: 400 }}>
            Ask me anything about {profile.name}'s health, sleep, feeding, development, or behavior.
          </p>

          {/* Starter questions */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 24, maxWidth: 560 }}>
            {[
              `Why is ${profile.name} waking at night?`,
              `Is ${profile.name} eating enough?`,
              `What should ${profile.name} be doing at this age?`,
              `What vaccines are coming up for ${profile.name}?`,
            ].map(q => (
              <button
                key={q}
                onClick={() => setInput(q)}
                style={{
                  background: "white",
                  border: "1.5px solid #F0EDED",
                  borderRadius: 20,
                  padding: "8px 14px",
                  fontSize: 13,
                  color: "#555",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                onMouseOver={e => (e.currentTarget.style.borderColor = "#E07A5F")}
                onMouseOut={e => (e.currentTarget.style.borderColor = "#F0EDED")}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Feature buttons */}
          <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => isPro ? setShowVaccines(true) : (() => { setProModalReason('vaccine'); setShowProModal(true); })()}
              style={{ background: "#FFF0E8", border: "none", borderRadius: 20, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#E07A5F", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              💉 {isPro ? "Vaccine Schedule" : "Unlock Vaccine Tracker"}
              {!isPro && <span style={{ fontSize: 10, background: "#E07A5F", color: "white", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>PRO</span>}
            </button>
            <button
              onClick={() => isPro ? setShowSleepCoach(true) : (() => { setProModalReason('questions'); setShowProModal(true); })()}
              style={{ background: "#F0F4FF", border: "none", borderRadius: 20, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#5B6EE8", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              🌙 {isPro ? "Sleep Coach" : "Unlock Sleep Coach"}
              {!isPro && <span style={{ fontSize: 10, background: "#5B6EE8", color: "white", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>PRO</span>}
            </button>
            <a
              href={`/guide?m=${getMonthsOld(profile.dob)}`}
              style={{ background: "#F0FAF4", borderRadius: 20, padding: "10px 20px", fontSize: 13, fontWeight: 600, color: "#3D9970", display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
            >
              📖 Age guide
            </a>
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

              {/* Memory confirmation toast */}
              {newMemories.length > 0 && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12, animation: "fadeIn 0.3s ease" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#F0FFF4", border: "1px solid #9AE6B4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🧠</div>
                  <div style={{ background: "#F0FFF4", border: "1px solid #9AE6B4", borderRadius: "4px 18px 18px 18px", padding: "10px 14px", maxWidth: "72%" }}>
                    <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#276749" }}>Remembered</p>
                    {newMemories.map((m, i) => (
                      <p key={i} style={{ margin: "2px 0", fontSize: 13, color: "#2D6A4F" }}>{m}</p>
                    ))}
                    <p style={{ margin: "6px 0 0", fontSize: 11, color: "#68D391" }}>You can ask me about this anytime.</p>
                  </div>
                </div>
              )}

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
              <div style={{ marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => isPro ? setShowVaccines(true) : (() => { setProModalReason('vaccine'); setShowProModal(true); })()}
                  style={{ background: "#FFF0E8", border: "none", borderRadius: 20, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#E07A5F", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  💉 {isPro ? "Vaccine Schedule" : "Unlock Vaccine Tracker"}
                  {!isPro && <span style={{ fontSize: 10, background: "#E07A5F", color: "white", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>PRO</span>}
                </button>
                <button
                  onClick={() => isPro ? setShowSleepCoach(true) : (() => { setProModalReason('questions'); setShowProModal(true); })()}
                  style={{ background: "#F0F4FF", border: "none", borderRadius: 20, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#5B6EE8", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  🌙 {isPro ? "Sleep Coach" : "Unlock Sleep Coach"}
                  {!isPro && <span style={{ fontSize: 10, background: "#5B6EE8", color: "white", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>PRO</span>}
                </button>
                <a
                  href={`/guide?m=${getMonthsOld(profile.dob)}`}
                  style={{ background: "#F0FAF4", borderRadius: 20, padding: "8px 18px", fontSize: 13, fontWeight: 600, color: "#3D9970", display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
                >
                  📖 Age guide
                </a>
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

      {/* Vaccine Tracker */}
      {showVaccines && (
        <VaccineTracker
          email={session?.user?.email || ''}
          childName={profile.name}
          childDob={profile.dob}
          onClose={() => setShowVaccines(false)}
        />
      )}

      {/* Memory View */}
      {showMemoryView && (
        <MemoryView
          name={profile.name}
          memories={memories}
          onClose={() => setShowMemoryView(false)}
          onDelete={deleteMemory}
          onConfirm={confirmMemory}
        />
      )}

      {/* Sleep Coach */}
      {showSleepCoach && (
        <SleepCoach
          childName={profile.name}
          childId={profile.child_id}
          onClose={() => setShowSleepCoach(false)}
        />
      )}

      {/* Daily Check-in */}
      {showCheckin && (
        <DailyCheckin
          childName={profile.name}
          childId={profile.child_id}
          onClose={() => {
            try { localStorage.setItem(`askneer_checkin_skipped_${new Date().toDateString()}`, '1'); } catch {}
            setShowCheckin(false);
          }}
          onComplete={() => setCheckinDoneToday(true)}
        />
      )}
    </div>
  );
}

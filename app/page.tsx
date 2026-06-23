"use client";
import { useState } from "react";

export default function Home() {
  const [profile, setProfile] = useState({ name: "", age: "", notes: "" });
  const [profileSaved, setProfileSaved] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [loading, setLoading] = useState(false);

  function saveProfile() {
    if (!profile.name || !profile.age) return alert("Please enter child's name and age");
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
    setLoading(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, profile, history: updatedMessages })
    });
    const data = await res.json();
    setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);
    setLoading(false);
  }

  if (!profileSaved) {
    return (
      <main style={{ padding: 24, maxWidth: 500, margin: "0 auto" }}>
        <h1>AskNeer</h1>
        <p>Tell me about your child first</p>
        <input placeholder="Child's name" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }} />
        <input placeholder="Age (e.g. 18 months, 3 years)" value={profile.age} onChange={e => setProfile({...profile, age: e.target.value})} style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }} />
        <textarea placeholder="Anything else I should know? (optional)" value={profile.notes} onChange={e => setProfile({...profile, notes: e.target.value})} style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }} rows={3} />
        <button onClick={saveProfile} style={{ padding: "10px 24px" }}>Start Chatting</button>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 500, margin: "0 auto" }}>
      <h1>AskNeer</h1>
      <p style={{ color: "#666" }}>Chatting about <strong>{profile.name}</strong>, {profile.age}</p>
      <div style={{ minHeight: 300, marginBottom: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 12, textAlign: m.role === "user" ? "right" : "left" }}>
            <span style={{ background: m.role === "user" ? "#0070f3" : "#f0f0f0", color: m.role === "user" ? "white" : "black", padding: "8px 12px", borderRadius: 12, display: "inline-block", maxWidth: "80%" }}>
              {m.content}
            </span>
          </div>
        ))}
        {loading && <p style={{ color: "#999" }}>AskNeer is thinking...</p>}
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={2} style={{ width: "100%", padding: 8 }} placeholder={`Ask about ${profile.name}...`} />
      <button onClick={ask} disabled={loading} style={{ padding: "10px 24px", marginTop: 8 }}>Ask</button>
    </main>
  );
}
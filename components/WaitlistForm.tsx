"use client";

import { useState } from "react";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p style={{ color: "#35f2d0", fontSize: "1rem", fontWeight: 600 }}>
        You&apos;re on the list — we&apos;ll map your path when it&apos;s ready.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 0, width: "100%", maxWidth: 480 }}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        style={{
          flex: 1,
          minWidth: 0,
          padding: "14px 16px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(244,247,251,0.18)",
          borderRight: "none",
          borderRadius: "999px 0 0 999px",
          color: "#f4f7fb",
          fontSize: "0.95rem",
          outline: "none",
        }}
      />
      <button
        type="submit"
        disabled={state === "loading"}
        style={{
          padding: "14px 24px",
          background: "linear-gradient(135deg, #35f2d0, #4aa3ff)",
          color: "#05070c",
          border: "none",
          borderRadius: "0 999px 999px 0",
          fontWeight: 740,
          fontSize: "0.95rem",
          cursor: "pointer",
          whiteSpace: "nowrap",
          opacity: state === "loading" ? 0.6 : 1,
          fontFamily: "inherit",
        }}
      >
        {state === "loading" ? "…" : "Join Early Access"}
      </button>
      {state === "error" && (
        <p style={{ position: "absolute", marginTop: 56, fontSize: "0.8rem", color: "#ff5c8a" }}>
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}

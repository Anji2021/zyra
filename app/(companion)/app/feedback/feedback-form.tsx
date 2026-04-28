"use client";

import { useState } from "react";
import { FEEDBACK_TYPE_OPTIONS } from "@/lib/feedback/types";

const SUCCESS_MESSAGE = "Thanks — your feedback helps improve Zyra.";

export function FeedbackForm() {
  const [type, setType] = useState<string>(FEEDBACK_TYPE_OPTIONS[0].value);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          message,
          email: email.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        if (data.error) console.error("[feedback form] submit error:", data.error);
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setTitle("");
      setMessage("");
      setEmail("");
      setType(FEEDBACK_TYPE_OPTIONS[0].value);
    } catch (err) {
      console.error("[feedback form] submit exception:", err);
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div
        className="rounded-3xl border border-accent/30 bg-soft-rose/30 px-5 py-8 text-center sm:px-8"
        role="status"
      >
        <p className="font-serif text-lg font-semibold text-foreground">{SUCCESS_MESSAGE}</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm font-semibold text-accent underline-offset-2 hover:underline"
        >
          Send another note
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {status === "error" && errorMessage ? (
        <p
          className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="feedback-type" className="text-xs font-semibold uppercase tracking-wide text-muted">
          Type
        </label>
        <select
          id="feedback-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
          required
        >
          {FEEDBACK_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="feedback-title" className="text-xs font-semibold uppercase tracking-wide text-muted">
          Title
        </label>
        <input
          id="feedback-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Short summary"
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="feedback-message" className="text-xs font-semibold uppercase tracking-wide text-muted">
          Message
        </label>
        <textarea
          id="feedback-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={8000}
          rows={6}
          placeholder="What would you like us to know?"
          className="w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="feedback-email" className="text-xs font-semibold uppercase tracking-wide text-muted">
          Email <span className="font-normal normal-case text-muted">(optional)</span>
        </label>
        <input
          id="feedback-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={320}
          placeholder="If you’d like a reply"
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "Saving…" : "Save feedback"}
      </button>
    </form>
  );
}

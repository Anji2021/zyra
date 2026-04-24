"use client";

import { useState } from "react";
import { FRIENDLY_TRY_AGAIN } from "@/lib/zyra/user-messages";
import { ZYRA } from "@/lib/zyra/site";

export function FeedbackForm() {
  const [type, setType] = useState<"feedback" | "topic_request">("feedback");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "zyra_app",
          type,
          title: title.trim(),
          message: message.trim(),
          email: email.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || data.success !== true) {
        setError(data.error ?? FRIENDLY_TRY_AGAIN);
        return;
      }
      setDone(true);
      setTitle("");
      setMessage("");
      setEmail("");
    } catch {
      setError(FRIENDLY_TRY_AGAIN);
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div
        className="rounded-2xl border border-border/70 bg-soft-rose/35 px-5 py-6 text-center text-sm text-foreground"
        role="status"
      >
        <p className="font-medium">Thank you — we received your note.</p>
        <p className="mt-2 text-muted">
          It helps {ZYRA.name} grow in the right direction. You can send another anytime.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-4 text-sm font-semibold text-accent underline-offset-2 hover:underline"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(ev) => void submit(ev)} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="fb-type" className="text-sm font-semibold text-foreground">
          Type
        </label>
        <select
          id="fb-type"
          value={type}
          onChange={(e) => setType(e.target.value as "feedback" | "topic_request")}
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none ring-accent/25 focus:ring-2"
        >
          <option value="feedback">General feedback</option>
          <option value="topic_request">Topic or resource request</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="fb-title" className="text-sm font-semibold text-foreground">
          Title
        </label>
        <input
          id="fb-title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short headline for your note"
          maxLength={200}
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none ring-accent/25 focus:ring-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="fb-message" className="text-sm font-semibold text-foreground">
          Message
        </label>
        <textarea
          id="fb-message"
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What would help you feel more supported in Zyra?"
          maxLength={8000}
          className="w-full resize-y rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none ring-accent/25 focus:ring-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="fb-email" className="text-sm font-semibold text-foreground">
          Email <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="fb-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="If you want a reply"
          maxLength={320}
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none ring-accent/25 focus:ring-2"
        />
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-950" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent px-8 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {pending ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}

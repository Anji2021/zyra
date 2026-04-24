"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AssistantChatMessage } from "@/lib/assistant/chat-types";
import { ASSISTANT_UNAVAILABLE } from "@/lib/assistant/chat-types";
import { FRIENDLY_TRY_AGAIN } from "@/lib/zyra/user-messages";
import { ZYRA } from "@/lib/zyra/site";

const DISCLAIMER =
  "This chat is for education only — not diagnosis or treatment. For medical decisions, talk with a licensed clinician.";

type AssistantChatProps = {
  initialMessages: AssistantChatMessage[];
};

function friendlyErrorForStatus(status: number, serverMessage?: string): string {
  if (status === 401) return serverMessage ?? "Sign in to use the assistant.";
  if (status === 400) return serverMessage ?? "That message could not be sent.";
  return FRIENDLY_TRY_AGAIN;
}

export function AssistantChat({ initialMessages }: AssistantChatProps) {
  const [messages, setMessages] = useState<AssistantChatMessage[]>(() => initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) console.error("[AssistantChat]", error);
  }, [error]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  async function clearChat() {
    if (loading || clearing || messages.length === 0) return;
    setError(null);
    setClearing(true);
    try {
      const res = await fetch("/api/assistant/clear", { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? ASSISTANT_UNAVAILABLE);
        return;
      }
      setMessages([]);
    } catch {
      setError(ASSISTANT_UNAVAILABLE);
    } finally {
      setClearing(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const optimisticId = `local-${crypto.randomUUID()}`;
    setError(null);
    setInput("");
    setMessages((m) => [...m, { id: optimisticId, role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = (await res.json()) as {
        reply?: string;
        error?: string;
        userMessage?: AssistantChatMessage;
        assistantMessage?: AssistantChatMessage;
      };

      if (!res.ok) {
        setError(friendlyErrorForStatus(res.status, data.error));
        return;
      }

      const reply = data.reply?.trim();
      const userMessage = data.userMessage;
      const assistantMessage = data.assistantMessage;
      if (!reply || !userMessage || !assistantMessage) {
        setError(ASSISTANT_UNAVAILABLE);
        return;
      }

      setMessages((m) => {
        const next = [...m];
        const last = next[next.length - 1];
        if (last?.role === "user" && last.content === text && last.id.startsWith("local-")) {
          next.pop();
        }
        next.push(userMessage, assistantMessage);
        return next;
      });
    } catch {
      setError(ASSISTANT_UNAVAILABLE);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[min(70vh,36rem)] flex-col rounded-3xl border border-border/80 bg-surface/90 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-center text-[11px] leading-relaxed text-muted sm:flex-1 sm:text-left sm:text-xs">
          {DISCLAIMER}
        </p>
        <button
          type="button"
          onClick={() => void clearChat()}
          disabled={loading || clearing || messages.length === 0}
          className="shrink-0 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          {clearing ? "Clearing…" : "Clear chat"}
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
        {messages.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border/80 bg-background/65 px-5 py-8 text-center">
            <p className="font-serif text-lg font-medium text-foreground">Ask {ZYRA.name} anything</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Periods, hormones, or how to prep for a visit — in plain language. I can&apos;t
              diagnose or prescribe; I&apos;m here to explain and sit with you.
            </p>
          </div>
        ) : null}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[75%] ${
                msg.role === "user"
                  ? "bg-accent text-accent-foreground"
                  : "border border-border/70 bg-background/90 text-foreground"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading ? (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-2.5 text-sm italic text-muted">
              {ZYRA.name} is typing…
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      {error ? (
        <div className="border-t border-red-200/60 bg-red-50 px-4 py-2 text-center text-xs text-red-950 sm:text-sm">
          {error}
        </div>
      ) : null}

      <div className="border-t border-border/60 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="sr-only" htmlFor="assistant-input">
            Message
          </label>
          <textarea
            id="assistant-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={2}
            placeholder="Ask something general…"
            disabled={loading || clearing}
            className="min-h-[3rem] flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={loading || clearing || !input.trim()}
            className="h-11 shrink-0 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send message
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted sm:text-xs">
          Shift+Enter for a new line · Emergency? Use local emergency services, not this chat.
        </p>
      </div>
    </div>
  );
}

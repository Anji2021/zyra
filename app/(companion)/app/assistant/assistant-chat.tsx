"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AssistantChatMessage } from "@/lib/assistant/chat-types";
import { ZYRA } from "@/lib/zyra/site";

const DISCLAIMER =
  "This chat is for education only — not diagnosis or treatment. For medical decisions, talk with a licensed clinician.";

const PROMPTS_GENERAL = [
  "Why is my cycle late?",
  "Is this symptom normal?",
  "What does irregular cycle mean?",
  "When should I see a doctor?",
  "Help me understand my cycle",
] as const;

const PROMPT_EXPLAIN_SYMPTOMS = "Explain my symptoms";

function quickPromptLabels(hasLoggedSymptoms: boolean): string[] {
  if (!hasLoggedSymptoms) {
    return [...PROMPTS_GENERAL];
  }
  return [
    PROMPTS_GENERAL[0],
    PROMPTS_GENERAL[1],
    PROMPT_EXPLAIN_SYMPTOMS,
    PROMPTS_GENERAL[2],
    PROMPTS_GENERAL[3],
    PROMPTS_GENERAL[4],
  ];
}

type AssistantChatProps = {
  initialMessages: AssistantChatMessage[];
  /** From health log — only affects which starter prompts appear */
  hasLoggedSymptoms?: boolean;
  /** Optional query-string prefill; never auto-sent */
  initialInput?: string;
};

type QuickPromptPillsProps = {
  prompts: string[];
  disabled: boolean;
  onPick: (text: string) => void;
  className?: string;
};

function QuickPromptPills({ prompts, disabled, onPick, className = "" }: QuickPromptPillsProps) {
  return (
    <ul
      className={`flex list-none flex-row flex-nowrap gap-1.5 overflow-x-auto pb-0.5 pl-0 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden ${className}`}
      aria-label="Quick prompt ideas"
    >
      {prompts.map((label) => (
        <li key={label} className="shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPick(label)}
            className="rounded-full border border-border/70 bg-soft-rose/30 px-3 py-1.5 text-left text-[11px] font-medium leading-snug text-muted shadow-none transition hover:border-accent/35 hover:bg-soft-rose/55 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:px-3.5 sm:text-xs"
          >
            {label}
          </button>
        </li>
      ))}
    </ul>
  );
}

function friendlyErrorForStatus(status: number, serverMessage?: string): string {
  if (status === 401) return "Something went wrong. Please try again.";
  if (status === 400) return "Something went wrong. Please try again.";
  if (status === 429) return "Something went wrong. Please try again.";
  return "Something went wrong. Please try again.";
}

export function AssistantChat({
  initialMessages,
  hasLoggedSymptoms = false,
  initialInput = "",
}: AssistantChatProps) {
  const [messages, setMessages] = useState<AssistantChatMessage[]>(() => initialMessages);
  const [input, setInput] = useState(initialInput);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const promptLabels = quickPromptLabels(hasLoggedSymptoms);
  const promptsDisabled = loading || clearing;

  const applyPrompt = useCallback((text: string) => {
    setInput(text);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(text.length, text.length);
      }
    });
  }, []);

  useEffect(() => {
    if (error) console.error("[AssistantChat]", error);
  }, [error]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (!initialInput.trim()) return;
    setInput((prev) => (prev.trim().length > 0 ? prev : initialInput));
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        const len = initialInput.length;
        el.setSelectionRange(len, len);
      }
    });
  }, [initialInput]);

  async function clearChat() {
    if (loading || clearing || messages.length === 0) return;
    setError(null);
    setClearing(true);
    try {
      const res = await fetch("/api/assistant/clear", { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        if (data.error) console.error("[AssistantChat] clear error:", data.error);
        setError("Something went wrong. Please try again.");
        return;
      }
      setMessages([]);
    } catch (err) {
      console.error("[AssistantChat] clear exception:", err);
      setError("Something went wrong. Please try again.");
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
        if (data.error) console.error("[AssistantChat] send error:", data.error);
        setError(friendlyErrorForStatus(res.status, data.error));
        return;
      }

      const reply = data.reply?.trim();
      const userMessage = data.userMessage;
      const assistantMessage = data.assistantMessage;
      if (!reply || !userMessage || !assistantMessage) {
        console.error("[AssistantChat] invalid response payload");
        setError("Something went wrong. Please try again.");
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
    } catch (err) {
      console.error("[AssistantChat] send exception:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[min(55vh,28rem)] flex-col rounded-2xl border border-border/80 bg-surface/90 shadow-sm sm:min-h-[min(70vh,36rem)] sm:rounded-3xl">
      <div className="flex flex-col gap-1.5 border-b border-border/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-5 sm:py-3">
        <p className="text-center text-[10px] leading-snug text-muted sm:flex-1 sm:text-left sm:text-xs sm:leading-relaxed">
          {DISCLAIMER}
        </p>
        <button
          type="button"
          onClick={() => void clearChat()}
          disabled={loading || clearing || messages.length === 0}
          className="shrink-0 rounded-full border border-border bg-background/80 px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-1.5 sm:text-xs"
        >
          {clearing ? "Clearing…" : "Clear chat"}
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:space-y-4 sm:px-6 sm:py-5">
        {messages.length === 0 ? (
          <div className="mx-auto max-w-md rounded-xl border border-dashed border-border/80 bg-background/65 px-3 py-5 text-center sm:rounded-2xl sm:px-5 sm:py-8">
            <p className="font-serif text-base font-medium text-foreground sm:text-lg">Ask {ZYRA.name} anything</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Periods, hormones, or how to prep for a visit — in plain language. I can&apos;t
              diagnose or prescribe; I&apos;m here to explain and sit with you.
            </p>
            <p className="mt-4 text-left text-xs font-medium text-muted">
              Not sure what to ask? Try one of these:
            </p>
            <div className="mt-2 text-left">
              <QuickPromptPills
                prompts={promptLabels}
                disabled={promptsDisabled}
                onPick={applyPrompt}
                className="-mx-0.5 px-0.5"
              />
            </div>
          </div>
        ) : null}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[75%] sm:rounded-2xl sm:px-4 sm:py-3 ${
                msg.role === "user"
                  ? "bg-accent text-accent-foreground"
                  : "border border-border/70 bg-background/90 text-foreground"
              }`}
            >
              {msg.content}
              {msg.role === "assistant" ? (
                <p className="mt-2 border-t border-border/40 pt-1.5 text-[10px] leading-snug text-muted">
                  This is general guidance, not medical advice.
                </p>
              ) : null}
            </div>
          </div>
        ))}

        {loading ? (
          <div className="flex justify-start">
            <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm italic text-muted sm:rounded-2xl sm:px-4 sm:py-2.5">
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

      <div className="border-t border-border/60 p-3 sm:p-5">
        <p className="mb-1.5 text-[10px] text-muted sm:text-xs">
          Tap a prompt to fill — press send when you&apos;re ready.
        </p>
        <QuickPromptPills
          prompts={promptLabels}
          disabled={promptsDisabled}
          onPick={applyPrompt}
          className="-mx-0.5 mb-2.5 px-0.5 sm:mb-3"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
          <label className="sr-only" htmlFor="assistant-input">
            Message
          </label>
          <textarea
            ref={inputRef}
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
            className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2 disabled:opacity-60 sm:min-h-[3rem] sm:rounded-2xl sm:px-4 sm:py-3"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={loading || clearing || !input.trim()}
            className="h-10 shrink-0 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:px-6"
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

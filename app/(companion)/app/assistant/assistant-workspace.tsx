"use client";

import {
  Lightbulb,
  Menu,
  MessageCircle,
  MessageSquarePlus,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AssistantChatMessage } from "@/lib/assistant/chat-types";
import {
  loadConversations,
  newEmptyConversation,
  saveConversations,
  seedFromLegacyMessages,
} from "@/lib/assistant/conversation-storage";
import { titleFromFirstUserMessage } from "@/lib/assistant/conversation-title";
import type { AssistantConversation, StoredAssistantMessage } from "@/lib/assistant/conversation-types";
import { ZYRA } from "@/lib/zyra/site";

const INPUT_DISCLAIMER = "Educational only — not medical advice.";

const SUGGESTED_PROMPTS = [
  "Why am I feeling fatigue?",
  "Help me prepare for a doctor visit",
  "Explain irregular periods",
  "What should I track this week?",
] as const;

function quickPromptsForUser(hasLoggedSymptoms: boolean): string[] {
  if (hasLoggedSymptoms) {
    return [...SUGGESTED_PROMPTS.slice(0, 3), "Explain my symptoms", SUGGESTED_PROMPTS[3]];
  }
  return [...SUGGESTED_PROMPTS];
}

function friendlyErrorForStatus(status: number): string {
  if (status === 401 || status === 400 || status === 429) return "Something went wrong. Please try again.";
  return "Something went wrong. Please try again.";
}

function formatListTime(ts: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(ts));
  } catch {
    return "";
  }
}

function formatBubbleTime(ts: number | undefined): string {
  if (ts == null) return "";
  try {
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(ts));
  } catch {
    return "";
  }
}

type DateGroup = "today" | "week" | "older";

function groupConversations(list: AssistantConversation[]): Record<DateGroup, AssistantConversation[]> {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startWeek = startToday - 7 * 86_400_000;
  const sorted = [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  const g: Record<DateGroup, AssistantConversation[]> = { today: [], week: [], older: [] };
  for (const c of sorted) {
    if (c.updatedAt >= startToday) g.today.push(c);
    else if (c.updatedAt >= startWeek) g.week.push(c);
    else g.older.push(c);
  }
  return g;
}

type AssistantWorkspaceProps = {
  userId: string;
  hasLoggedSymptoms: boolean;
  initialInput?: string;
  /** Legacy Supabase rows to migrate into first local thread when storage is empty */
  legacySeedMessages: AssistantChatMessage[];
};

export function AssistantWorkspace({
  userId,
  hasLoggedSymptoms,
  initialInput = "",
  legacySeedMessages,
}: AssistantWorkspaceProps) {
  const [hydrated, setHydrated] = useState(false);
  const [conversations, setConversations] = useState<AssistantConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState(initialInput);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"chat" | "history" | "prompts">("chat");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const legacyRef = useRef(legacySeedMessages);

  const promptChoices = useMemo(() => quickPromptsForUser(hasLoggedSymptoms), [hasLoggedSymptoms]);

  useEffect(() => {
    let list = loadConversations(userId);
    const legacy = legacyRef.current;
    if (list.length === 0 && legacy.length > 0) {
      list = seedFromLegacyMessages(legacy);
      saveConversations(userId, list);
    }
    if (list.length === 0) {
      const fresh = newEmptyConversation();
      list = [fresh];
      saveConversations(userId, list);
    }
    setConversations(list);
    setActiveId(list[0]?.id ?? null);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once per user id
  }, [userId]);

  useEffect(() => {
    if (!hydrated) return;
    saveConversations(userId, conversations);
  }, [hydrated, userId, conversations]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const messages = active?.messages ?? [];

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, activeId, scrollToBottom]);

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

  const newChat = useCallback(() => {
    const n = newEmptyConversation();
    setConversations((prev) => [n, ...prev]);
    setActiveId(n.id);
    setInput("");
    setError(null);
    setMobileTab("chat");
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) {
        const fresh = newEmptyConversation();
        setActiveId(fresh.id);
        return [fresh];
      }
      setActiveId((cur) => (cur === id ? next[0]!.id : cur));
      return next;
    });
  }, []);

  const clearActiveChat = useCallback(() => {
    if (!activeId || messages.length === 0) return;
    if (!window.confirm("Clear all messages in this chat? This cannot be undone.")) return;
    const t = Date.now();
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, messages: [], title: "New chat", updatedAt: t } : c,
      ),
    );
    setError(null);
  }, [activeId, messages.length]);

  const applyPrompt = useCallback((text: string) => {
    setInput(text);
    setMobileTab("chat");
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(text.length, text.length);
      }
    });
  }, []);

  const sendWithText = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || loading || !activeId) return;

      let convId = activeId;
      let prior = conversations.find((c) => c.id === convId);
      if (!prior) return;

      const optimisticId = `local-${crypto.randomUUID()}`;
      const now = Date.now();
      const userPartial: StoredAssistantMessage = {
        id: optimisticId,
        role: "user",
        content: text,
        createdAt: now,
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          const nextMsgs = [...c.messages, userPartial];
          const title =
            c.messages.filter((m) => m.role === "user").length === 0
              ? titleFromFirstUserMessage(text)
              : c.title;
          return { ...c, messages: nextMsgs, title, updatedAt: now };
        }),
      );
      setInput("");
      setLoading(true);
      setError(null);

      const historyPayload = prior.messages.map(({ role, content }) => ({ role, content }));

      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            conversationHistory: historyPayload,
          }),
        });
        const data = (await res.json()) as {
          reply?: string;
          userMessage?: AssistantChatMessage;
          assistantMessage?: AssistantChatMessage;
          error?: string;
        };

        if (!res.ok) {
          if (data.error) console.error("[AssistantWorkspace] send error:", data.error);
          setError(friendlyErrorForStatus(res.status));
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? { ...c, messages: c.messages.filter((m) => m.id !== optimisticId) }
                : c,
            ),
          );
          setInput(text);
          return;
        }

        const userMessage = data.userMessage;
        const assistantMessage = data.assistantMessage;
        if (!userMessage || !assistantMessage) {
          setError("Something went wrong. Please try again.");
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? { ...c, messages: c.messages.filter((m) => m.id !== optimisticId) }
                : c,
            ),
          );
          setInput(text);
          return;
        }

        const stamp = Date.now();
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c;
            const withoutOpt = c.messages.filter((m) => m.id !== optimisticId);
            const um: StoredAssistantMessage = {
              ...userMessage,
              createdAt: stamp,
            };
            const am: StoredAssistantMessage = {
              ...assistantMessage,
              createdAt: stamp,
            };
            return {
              ...c,
              messages: [...withoutOpt, um, am],
              updatedAt: stamp,
            };
          }),
        );
      } catch (e) {
        console.error("[AssistantWorkspace] send exception:", e);
        setError("Something went wrong. Please try again.");
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId ? { ...c, messages: c.messages.filter((m) => m.id !== optimisticId) } : c,
          ),
        );
        setInput(text);
      } finally {
        setLoading(false);
      }
    },
    [loading, activeId, conversations],
  );

  const sendPromptDirect = useCallback(
    (text: string) => {
      setMobileTab("chat");
      void sendWithText(text);
    },
    [sendWithText],
  );

  const send = useCallback(() => {
    void sendWithText(input);
  }, [input, sendWithText]);

  const grouped = useMemo(() => groupConversations(conversations), [conversations]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[min(70vh,40rem)] items-center justify-center rounded-2xl border border-border/60 bg-surface/80 p-8 text-sm text-muted">
        Loading assistant…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-3 lg:gap-4">
      {/* Mobile / tablet tab bar — desktop uses 3-column grid */}
      <div className="flex shrink-0 gap-1 rounded-2xl border border-border/60 bg-surface/90 p-1 lg:hidden">
        {(
          [
            ["chat", "Chat", MessageCircle],
            ["history", "History", Menu],
            ["prompts", "Prompts", Lightbulb],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMobileTab(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition ${
              mobileTab === key
                ? "bg-soft-rose/80 text-foreground shadow-sm"
                : "text-muted hover:bg-background/80"
            }`}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)_260px] lg:gap-5 xl:grid-cols-[260px_minmax(0,1fr)_280px]">
        {/* LEFT — History (desktop always; mobile when tab) */}
        <aside
          className={`min-h-0 min-w-0 flex-col rounded-2xl border border-border/55 bg-surface/95 p-3 shadow-sm lg:flex ${
            mobileTab === "history" ? "flex max-h-[70vh] lg:max-h-none" : "hidden"
          }`}
        >
          <button
            type="button"
            onClick={newChat}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-accent/35 bg-soft-rose/40 py-2.5 text-sm font-semibold text-foreground transition hover:bg-soft-rose/55"
          >
            <Plus className="size-4" aria-hidden />
            New chat
          </button>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">Recent</p>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-0.5">
            {( ["today", "week", "older"] as const ).map((key) => {
              const label =
                key === "today" ? "Today" : key === "week" ? "Previous 7 days" : "Older";
              const items = grouped[key];
              if (items.length === 0) return null;
              return (
                <div key={key}>
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted/90">
                    {label}
                  </p>
                  <ul className="space-y-1">
                    {items.map((c) => (
                      <li key={c.id}>
                        <div
                          className={`group flex items-start gap-1 rounded-xl border px-2 py-2 text-left transition ${
                            c.id === activeId
                              ? "border-accent/40 bg-soft-rose/45"
                              : "border-transparent bg-background/70 hover:border-border/60"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveId(c.id);
                              setMobileTab("chat");
                            }}
                            className="min-w-0 flex-1 text-left"
                          >
                            <span className="line-clamp-2 text-xs font-medium leading-snug text-foreground">
                              {c.title}
                            </span>
                            <span className="mt-0.5 block text-[10px] text-muted">
                              {formatListTime(c.updatedAt)}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteConversation(c.id)}
                            className="shrink-0 rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-red-500/10 hover:text-red-700 group-hover:opacity-100"
                            aria-label="Delete conversation"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </aside>

        {/* CENTER — Chat */}
        <section
          className={`min-h-0 min-w-0 flex-col ${mobileTab === "chat" ? "flex" : "hidden lg:flex"}`}
        >
          <div className="flex h-[min(72vh,720px)] min-h-[22rem] flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface/95 shadow-md lg:h-[min(75vh,760px)]">
            <header className="shrink-0 border-b border-border/50 bg-background/50 px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-serif text-lg font-semibold leading-tight text-foreground sm:text-xl line-clamp-2">
                    {active?.title ?? "Chat"}
                  </h2>
                  <p className="mt-1 text-[11px] text-muted">{INPUT_DISCLAIMER}</p>
                </div>
                <button
                  type="button"
                  onClick={clearActiveChat}
                  disabled={loading || messages.length === 0}
                  className="shrink-0 rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-soft-rose/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear chat
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5">
              {messages.length === 0 ? (
                <div className="mx-auto flex max-w-md flex-col items-center px-2 text-center">
                  <MessageSquarePlus className="size-10 text-accent/80" aria-hidden />
                  <p className="mt-4 font-serif text-lg font-semibold text-foreground">
                    Ask {ZYRA.name} anything about your cycle, symptoms, or health logs.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Plain-language education — never a substitute for your clinician.
                  </p>
                  <p className="mt-6 text-xs font-medium text-muted lg:hidden">Quick starts</p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2 lg:hidden">
                    {promptChoices.slice(0, 4).map((p) => (
                      <button
                        key={p}
                        type="button"
                        disabled={loading}
                        onClick={() => sendPromptDirect(p)}
                        className="rounded-full border border-border/70 bg-soft-rose/25 px-3 py-1.5 text-left text-[11px] font-medium text-foreground transition hover:bg-soft-rose/45 disabled:opacity-50"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <ul className="mx-auto max-w-3xl space-y-4 pb-2">
                  {messages.map((msg) => (
                    <li
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[min(92%,28rem)] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm sm:px-4 sm:py-3 ${
                          msg.role === "user"
                            ? "bg-accent text-accent-foreground"
                            : "border border-border/60 bg-background/95 text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p
                          className={`mt-1.5 text-[10px] ${
                            msg.role === "user" ? "text-accent-foreground/75" : "text-muted"
                          }`}
                        >
                          {formatBubbleTime(msg.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                  {loading ? (
                    <li className="flex justify-start">
                      <div className="rounded-2xl border border-border/50 bg-background/90 px-4 py-2.5 text-sm italic text-muted">
                        {ZYRA.name} is typing…
                      </div>
                    </li>
                  ) : null}
                </ul>
              )}
              <div ref={endRef} className="h-px shrink-0 scroll-mt-4" aria-hidden />
            </div>

            {error ? (
              <div className="border-t border-red-200/50 bg-red-50/90 px-4 py-2 text-center text-xs text-red-900">
                {error}
              </div>
            ) : null}

            <div className="shrink-0 border-t border-border/55 bg-background/90 px-3 py-3 sm:px-5 sm:py-4">
              <p className="mb-2 text-center text-[10px] text-muted sm:text-left">{INPUT_DISCLAIMER}</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                <label className="sr-only" htmlFor="assistant-workspace-input">
                  Message
                </label>
                <textarea
                  ref={inputRef}
                  id="assistant-workspace-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  rows={2}
                  placeholder={`Message ${ZYRA.name}…`}
                  disabled={loading}
                  className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent/25 focus:ring-2 disabled:opacity-60 sm:min-h-[3rem] sm:rounded-2xl sm:py-3"
                />
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={loading || !input.trim()}
                  className="h-10 shrink-0 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11"
                >
                  Send
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-muted">
                Enter to send · Shift+Enter for a new line
              </p>
            </div>
          </div>
        </section>

        {/* RIGHT — Tools / prompts */}
        <aside
          className={`min-h-0 flex-col gap-4 lg:flex ${
            mobileTab === "prompts" ? "flex" : "hidden"
          }`}
        >
          <div className="rounded-2xl border border-border/55 bg-surface/95 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-foreground">
              <Sparkles className="size-4 text-accent" aria-hidden />
              <h3 className="text-sm font-semibold">Quick starts</h3>
            </div>
            <ul className="mt-3 space-y-2">
              {promptChoices.map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => applyPrompt(p)}
                    className="w-full rounded-xl border border-border/60 bg-background/90 px-3 py-2.5 text-left text-xs font-medium leading-snug text-foreground transition hover:border-accent/30 hover:bg-soft-rose/25 disabled:opacity-50"
                  >
                    {p}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-200/40 bg-amber-50/50 p-4 dark:bg-amber-950/20">
            <p className="text-xs font-semibold text-foreground">Safety</p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              {ZYRA.name} can explain patterns and help you prepare questions, but cannot diagnose or prescribe.
            </p>
          </div>

          <div className="rounded-2xl border border-border/50 bg-background/90 p-4">
            <p className="text-xs font-semibold text-foreground">Context</p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              When available, your saved profile and logs may inform responses — still educational only, not a medical
              record for your clinic unless you choose to share.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

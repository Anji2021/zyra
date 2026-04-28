"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  RESOURCE_CATEGORIES,
  type ResourceArticle,
  type ResourceCategory,
} from "@/data/resources";

const LIST_DISCLAIMER =
  "Educational content only — not medical advice. Zyra does not replace your clinician.";

type ResourcesExplorerProps = {
  articles: ResourceArticle[];
};

export function ResourcesExplorer({ articles }: ResourcesExplorerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ResourceCategory | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (!q) return true;
      const blob = `${a.title} ${a.description} ${a.category}`.toLowerCase();
      return blob.includes(q);
    });
  }, [articles, query, category]);

  return (
    <div className="space-y-5 sm:space-y-8">
      <p className="rounded-xl border border-border/80 bg-soft-rose/40 px-3 py-2.5 text-center text-[11px] leading-relaxed text-muted sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
        {LIST_DISCLAIMER}
      </p>

      <div className="space-y-4">
        <label className="sr-only" htmlFor="resource-search">
          Search articles
        </label>
        <input
          id="resource-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, topic, or category…"
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              category === "all"
                ? "bg-accent text-accent-foreground"
                : "border border-border bg-surface text-muted hover:border-accent/40"
            }`}
          >
            All
          </button>
          {RESOURCE_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                category === c
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-surface text-muted hover:border-accent/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/90 bg-background/65 px-4 py-10 text-center sm:rounded-3xl sm:px-6 sm:py-14">
          <p className="font-serif text-base font-semibold text-foreground sm:text-lg">No articles match</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-snug text-muted sm:mt-3 sm:leading-relaxed">
            Try a different search word, pick &quot;All&quot; categories, or clear the search box.
            Every article is written to be short — if you still can&apos;t find what you need, use
            Feedback to request a topic.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
            className="mt-4 rounded-full border border-accent/40 bg-soft-rose/30 px-4 py-2 text-xs font-semibold text-accent transition hover:bg-soft-rose/50 sm:mt-6 sm:px-5"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 sm:gap-5">
          {filtered.map((article) => (
            <li key={article.id} className="min-w-0">
              <Link
                href={`/app/resources/${article.id}`}
                className="flex h-full min-h-[9.5rem] flex-col rounded-2xl border border-border/80 bg-surface/90 p-4 shadow-sm transition hover:border-accent/30 hover:bg-soft-rose/20 sm:min-h-[11rem] sm:rounded-3xl sm:p-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-soft-rose/80 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
                    {article.category}
                  </span>
                  <span className="text-[11px] font-medium text-muted">{article.readTime}</span>
                </div>
                <h2 className="mt-3 font-serif text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl">
                  {article.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{article.description}</p>
                <span className="mt-4 text-xs font-semibold text-accent">Read article →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-xs leading-relaxed text-muted">{LIST_DISCLAIMER}</p>
    </div>
  );
}

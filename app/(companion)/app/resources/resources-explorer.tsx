"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  RESOURCE_CATEGORIES,
  type ResourceArticle,
  type ResourceCategory,
} from "@/data/resources";

const DISCLAIMER =
  "This content is for educational purposes only and does not replace medical advice.";

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
      const blob = `${a.title} ${a.description}`.toLowerCase();
      return blob.includes(q);
    });
  }, [articles, query, category]);

  return (
    <div className="space-y-8">
      <p className="rounded-2xl border border-border/80 bg-soft-rose/40 px-4 py-3 text-center text-xs leading-relaxed text-muted sm:text-sm">
        {DISCLAIMER}
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
          placeholder="Search by title or topic…"
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
        <p className="rounded-2xl border border-dashed border-border/80 bg-background/65 px-4 py-10 text-center text-sm leading-relaxed text-muted">
          You haven&apos;t found a match yet. Try a shorter word or clear the filters — the library
          is small on purpose, so you never have to scroll forever.
        </p>
      ) : (
        <ul className="space-y-4">
          {filtered.map((article) => (
            <li key={article.id}>
              <Link
                href={`/app/resources/${article.id}`}
                className="block rounded-3xl border border-border/80 bg-surface/90 p-5 shadow-sm transition hover:border-accent/30 hover:bg-soft-rose/20 sm:p-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-soft-rose/80 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
                    {article.category}
                  </span>
                  <span className="text-[11px] font-medium text-muted">{article.readTime}</span>
                </div>
                <h2 className="mt-3 font-serif text-xl font-semibold tracking-tight text-foreground">
                  {article.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{article.description}</p>
                <span className="mt-4 inline-block text-xs font-semibold text-accent">Read article →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-xs leading-relaxed text-muted">{DISCLAIMER}</p>
    </div>
  );
}

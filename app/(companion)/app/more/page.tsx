import Link from "next/link";
import { Bookmark, BookOpen, MapPinned, Sparkles, UserRound } from "lucide-react";
import { ZYRA } from "@/lib/zyra/site";

export const dynamic = "force-dynamic";

const links = [
  {
    href: "/app/profile",
    label: "Profile",
    description: "Your name, goals, and account — update when life shifts.",
    icon: UserRound,
  },
  {
    href: "/app/resources",
    label: "Resources",
    description: "Short reads for clarity before or after a visit.",
    icon: BookOpen,
  },
  {
    href: "/app/specialists",
    label: "Specialists",
    description: "Find nearby providers (discovery only — no booking here).",
    icon: MapPinned,
  },
  {
    href: "/app/saved",
    label: "Saved",
    description: "Providers you chose to remember from search.",
    icon: Bookmark,
  },
  {
    href: "/app/insights",
    label: "Insights",
    description: "A soft place for patterns when your logs grow over time.",
    icon: Sparkles,
  },
] as const;

export default function MorePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">More</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Everything else
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted">
          A little room for reading, finding care, and your account — without crowding the main
          tabs.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        {links.map(({ href, label, description, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex h-full flex-col rounded-3xl border border-border/70 bg-surface/90 p-5 shadow-sm transition hover:border-accent/25 hover:bg-soft-rose/15 sm:p-6"
            >
              <Icon className="size-9 shrink-0 text-accent" aria-hidden />
              <span className="mt-4 font-serif text-lg font-semibold text-foreground">{label}</span>
              <span className="mt-2 text-sm leading-relaxed text-muted">{description}</span>
              <span className="mt-4 text-xs font-semibold text-accent">Open →</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-center text-xs leading-relaxed text-muted">
        {ZYRA.name} keeps learning light — your clinician still leads your care.
      </p>
    </div>
  );
}

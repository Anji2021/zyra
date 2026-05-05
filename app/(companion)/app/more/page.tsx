import Link from "next/link";
import { BellRing, Bookmark, BookOpen, MapPinned, Sparkles } from "lucide-react";
import { AppPage, PageHeader } from "@/components/product/page-system";
import { ZYRA } from "@/lib/zyra/site";

export const dynamic = "force-dynamic";

const links = [
  {
    href: "/app/resources",
    label: "Resources",
    description: "Short reads for clarity before or after a visit.",
    icon: BookOpen,
  },
  {
    href: "/app/reminders",
    label: "Reminders",
    description: "Private reminders for medicine, cycle, and check-ins.",
    icon: BellRing,
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
    <AppPage>
      <PageHeader
        eyebrow="More"
        title="Everything else"
        subtitle="A little room for reading, finding care, and revisiting saved picks — without crowding the main tabs."
      />

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {links.map(({ href, label, description, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-0 flex-col rounded-2xl border border-border/70 bg-surface/90 p-4 shadow-sm transition hover:border-accent/25 hover:bg-soft-rose/15 sm:min-h-[8.5rem] sm:rounded-3xl sm:p-5"
            >
              <Icon className="size-7 shrink-0 text-accent sm:size-8" aria-hidden />
              <span className="mt-2 font-serif text-base font-semibold text-foreground sm:mt-3 sm:text-lg">
                {label}
              </span>
              <span className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted sm:mt-2 sm:text-sm sm:leading-relaxed">
                {description}
              </span>
              <span className="mt-3 text-[11px] font-semibold text-accent sm:mt-4 sm:text-xs">Open →</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-center text-[11px] leading-relaxed text-muted sm:text-xs">
        {ZYRA.name} keeps learning light — your clinician still leads your care.
      </p>
    </AppPage>
  );
}

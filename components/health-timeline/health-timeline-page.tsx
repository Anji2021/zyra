"use client";

import {
  Activity,
  Bell,
  CalendarHeart,
  ChevronDown,
  ChevronRight,
  Pill,
  Search,
  User,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  filterTimelineEvents,
  type HealthTimelineEvent,
  type RuleBasedTimelineSummaries,
  type TimelineFilter,
} from "@zyra/shared";
import {
  buildMonthSidebarHighlights,
  buildStatSummary,
  DEFAULT_DATE_RANGE,
  filterEventsByDateRange,
  filterEventsBySearch,
  groupEventsByMonthThenDate,
  INITIAL_VISIBLE_EVENTS,
  type DateRangePreset,
  SHOW_MORE_INCREMENT,
  subtitleForEvent,
} from "@/lib/health-timeline/timeline-view-utils";
import { formatTimelineGroupDate, timelineKindLabel } from "./timeline-shared";

const FILTERS: { key: TimelineFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "cycle", label: "Cycle" },
  { key: "symptoms", label: "Symptoms" },
  { key: "medicine", label: "Medicine" },
  { key: "notes", label: "Notes" },
  { key: "reminders", label: "Reminders" },
];

const DATE_RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

function kindIcon(kind: HealthTimelineEvent["kind"]) {
  const cls = "size-3.5 shrink-0";
  switch (kind) {
    case "cycle":
      return <CalendarHeart className={`${cls} text-rose-600`} aria-hidden />;
    case "symptom":
      return <Activity className={`${cls} text-violet-600`} aria-hidden />;
    case "medicine":
      return <Pill className={`${cls} text-emerald-600`} aria-hidden />;
    case "reminder":
      return <Bell className={`${cls} text-amber-600`} aria-hidden />;
    case "profile":
      return <User className={`${cls} text-sky-600`} aria-hidden />;
    default:
      return null;
  }
}

type HealthTimelinePageProps = {
  initialEvents: HealthTimelineEvent[];
  summaries: RuleBasedTimelineSummaries;
  /** Server time for consistent date-range math */
  generatedAtIso: string;
};

export function HealthTimelinePage({
  initialEvents,
  summaries,
  generatedAtIso,
}: HealthTimelinePageProps) {
  const now = useMemo(() => new Date(generatedAtIso), [generatedAtIso]);

  const [filter, setFilter] = useState<TimelineFilter>("all");
  const [dateRange, setDateRange] = useState<DateRangePreset>(DEFAULT_DATE_RANGE);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_EVENTS);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(() => new Set());

  const hasAnyEvents = initialEvents.length > 0;

  const pipeline = useMemo(() => {
    const byFilter = filterTimelineEvents(initialEvents, filter);
    const byDate = filterEventsByDateRange(byFilter, dateRange, now);
    const bySearch = filterEventsBySearch(byDate, search);
    return { byFilter, byDate, bySearch };
  }, [initialEvents, filter, dateRange, search, now]);

  const filteredForFeed = pipeline.bySearch;

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_EVENTS);
  }, [filter, dateRange, search]);

  const ordered = useMemo(
    () => [...filteredForFeed].sort((a, b) => b.sortAt - a.sortAt),
    [filteredForFeed],
  );

  const visibleEvents = useMemo(
    () => ordered.slice(0, visibleCount),
    [ordered, visibleCount],
  );

  const hasMore = visibleCount < ordered.length;
  const stats = useMemo(() => buildStatSummary(filteredForFeed), [filteredForFeed]);
  const sidebarHints = useMemo(
    () => buildMonthSidebarHighlights(filteredForFeed, now),
    [filteredForFeed, now],
  );

  const monthGroups = useMemo(() => groupEventsByMonthThenDate(visibleEvents), [visibleEvents]);

  useEffect(() => {
    // Default behavior: most recent month open, older months collapsed.
    if (monthGroups.length <= 1) {
      setCollapsedMonths(new Set());
      return;
    }
    setCollapsedMonths(new Set(monthGroups.slice(1).map((m) => m.monthKey)));
  }, [monthGroups]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleMonth = useCallback((monthKey: string) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthKey)) next.delete(monthKey);
      else next.add(monthKey);
      return next;
    });
  }, []);

  const feedEmpty = filteredForFeed.length === 0;

  const worthTrackingShort = useMemo(() => {
    const t = summaries.thisWeek.body;
    return t.length > 220 ? `${t.slice(0, 217)}…` : t;
  }, [summaries.thisWeek.body]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 sm:gap-7">
      {/* Compact KPI row */}
      <section
        aria-label="Timeline summary"
        className="-mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:pb-0 lg:gap-4"
      >
        <div className="min-w-[calc(50%-0.25rem)] shrink-0 rounded-xl border border-border/55 bg-surface/95 px-3 py-2.5 shadow-sm sm:min-w-0 sm:rounded-2xl sm:px-3.5 sm:py-3">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">Total events</p>
          <p className="mt-1 font-serif text-lg font-semibold tabular-nums text-foreground sm:text-xl">
            {stats.totalInView}
          </p>
          <p className="mt-0.5 text-[10px] leading-snug text-muted">In current view</p>
        </div>
        <div className="min-w-[calc(50%-0.25rem)] shrink-0 rounded-xl border border-border/55 bg-surface/95 px-3 py-2.5 shadow-sm sm:min-w-0 sm:rounded-2xl sm:px-3.5 sm:py-3">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">Latest cycle</p>
          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-foreground sm:text-sm">
            {stats.latestCycleLabel}
          </p>
        </div>
        <div className="min-w-[calc(50%-0.25rem)] shrink-0 rounded-xl border border-border/55 bg-surface/95 px-3 py-2.5 shadow-sm sm:min-w-0 sm:rounded-2xl sm:px-3.5 sm:py-3">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">Symptoms</p>
          <p className="mt-1 font-serif text-lg font-semibold tabular-nums text-foreground sm:text-xl">
            {stats.symptomCount}
          </p>
          <p className="mt-0.5 text-[10px] text-muted">In view</p>
        </div>
        <div className="min-w-[calc(50%-0.25rem)] shrink-0 rounded-xl border border-border/55 bg-surface/95 px-3 py-2.5 shadow-sm sm:min-w-0 sm:rounded-2xl sm:px-3.5 sm:py-3">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">Meds / reminders</p>
          <p className="mt-1 font-serif text-lg font-semibold tabular-nums text-foreground sm:text-xl">
            {stats.medicineReminderCount}
          </p>
          <p className="mt-0.5 text-[10px] text-muted">In view</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15.5rem] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0 space-y-4">
          {/* Controls */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-background/80 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:p-4">
            <label className="relative min-w-[min(100%,14rem)] flex-1 sm:max-w-xs">
              <span className="sr-only">Search timeline</span>
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search timeline"
                className="w-full rounded-xl border border-border/70 bg-background py-2 pl-9 pr-3 text-sm outline-none ring-accent/25 focus:ring-2"
                autoComplete="off"
              />
            </label>
            <div className="flex min-w-0 items-center gap-2">
              <label htmlFor="timeline-range" className="sr-only">
                Date range
              </label>
              <select
                id="timeline-range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRangePreset)}
                className="min-h-10 min-w-0 flex-1 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm font-medium text-foreground outline-none sm:flex-initial sm:min-w-[11rem]"
              >
                {DATE_RANGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="-mx-0.5 flex gap-2 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:thin] sm:mx-0">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:py-2 ${
                  filter === key
                    ? "border-accent/50 bg-soft-rose/50 text-foreground"
                    : "border-border/70 bg-background/90 text-muted hover:border-accent/30"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {!hasAnyEvents ? (
            <p className="rounded-2xl border border-dashed border-border/70 bg-background/70 px-4 py-10 text-center text-sm text-muted">
              Your health timeline will appear as you log cycles, symptoms, medicines, notes, and reminders.
            </p>
          ) : feedEmpty ? (
            <p className="rounded-2xl border border-dashed border-amber-200/60 bg-amber-50/40 px-4 py-8 text-center text-sm text-muted dark:bg-amber-950/20">
              {search.trim()
                ? "No results match your search — try different words or clear filters."
                : "No entries in this date range and filter — widen the range or choose All time."}
            </p>
          ) : (
            <>
              <ul className="space-y-5">
                {monthGroups.map((month) => {
                  const collapsed = collapsedMonths.has(month.monthKey);
                  return (
                    <li key={month.monthKey} className="rounded-2xl border border-border/45 bg-surface/90 p-3 shadow-sm sm:p-4">
                      <button
                        type="button"
                        onClick={() => toggleMonth(month.monthKey)}
                        className="flex w-full items-center gap-2 text-left"
                        aria-expanded={!collapsed}
                      >
                        {collapsed ? (
                          <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
                        ) : (
                          <ChevronDown className="size-4 shrink-0 text-muted" aria-hidden />
                        )}
                        <h2 className="font-serif text-base font-semibold text-foreground sm:text-lg">
                          {month.monthLabel}
                        </h2>
                        <div className="ml-auto text-right">
                          <p className="text-[11px] text-muted">
                            {month.days.reduce((n, d) => n + d.events.length, 0)} event
                            {month.days.reduce((n, d) => n + d.events.length, 0) === 1 ? "" : "s"}
                          </p>
                          <p className="text-[10px] text-muted/90">
                            {monthBreakdown(month.days.flatMap((d) => d.events))}
                          </p>
                        </div>
                      </button>

                      {!collapsed ? (
                        <ul className="mt-4 space-y-5 border-l-2 border-accent/20 pl-3 sm:pl-4">
                          {month.days.map((day) => (
                            <li key={day.dateKey}>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                                {day.dayLabel}
                              </p>
                              <ul className="mt-2 space-y-1.5">
                                {day.events.map((ev) => {
                                  const expanded = expandedIds.has(ev.id);
                                  const sub = subtitleForEvent(ev, 64);
                                  return (
                                    <li key={ev.id}>
                                      <div
                                        className={`rounded-lg border bg-background/95 transition ${
                                          expanded ? "border-accent/35 shadow-sm" : "border-border/50"
                                        }`}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => toggleExpanded(ev.id)}
                                          className="flex w-full items-start gap-2 px-2.5 py-2 text-left sm:gap-2.5 sm:px-3"
                                          aria-expanded={expanded}
                                        >
                                          <span className="mt-0.5">{kindIcon(ev.kind)}</span>
                                          <span className="min-w-0 flex-1">
                                            <span className="flex flex-wrap items-center gap-2">
                                              <span className="text-sm font-semibold leading-tight text-foreground">
                                                {ev.title}
                                              </span>
                                              <span className="rounded-md border border-border/60 bg-soft-rose/20 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-accent">
                                                {timelineKindLabel(ev.kind)}
                                              </span>
                                            </span>
                                            {sub && !expanded ? (
                                              <span className="mt-0.5 line-clamp-1 text-[11px] text-muted">{sub}</span>
                                            ) : null}
                                            {!expanded ? (
                                              <span className="mt-0.5 text-[10px] text-muted/90">
                                                {formatTimelineGroupDate(ev.date)}
                                              </span>
                                            ) : null}
                                          </span>
                                          <ChevronDown
                                            className={`size-4 shrink-0 text-muted transition ${
                                              expanded ? "rotate-180" : ""
                                            }`}
                                            aria-hidden
                                          />
                                        </button>
                                        {expanded ? (
                                          <div className="border-t border-border/40 px-2.5 pb-2.5 pt-2 sm:px-3">
                                            {ev.detail ? (
                                              <p className="text-xs leading-relaxed text-muted">{ev.detail}</p>
                                            ) : (
                                              <p className="text-xs text-muted">No extra detail on this entry.</p>
                                            )}
                                            <dl className="mt-2 grid gap-1 text-[11px] text-muted sm:grid-cols-2">
                                              <div>
                                                <dt className="inline font-medium text-foreground/80">Type · </dt>
                                                <dd className="inline">{timelineKindLabel(ev.kind)}</dd>
                                              </div>
                                              <div>
                                                <dt className="inline font-medium text-foreground/80">Date · </dt>
                                                <dd className="inline">{formatTimelineGroupDate(ev.date)}</dd>
                                              </div>
                                              <div className="sm:col-span-2">
                                                <dt className="inline font-medium text-foreground/80">Recorded · </dt>
                                                <dd className="inline">
                                                  {new Date(ev.sortAt).toLocaleString(undefined, {
                                                    dateStyle: "medium",
                                                    timeStyle: "short",
                                                  })}
                                                </dd>
                                              </div>
                                              {ev.hasNotes ? (
                                                <div className="sm:col-span-2 text-amber-800/90 dark:text-amber-200/90">
                                                  Includes a note you added.
                                                </div>
                                              ) : null}
                                            </dl>
                                          </div>
                                        ) : null}
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              {hasMore ? (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + SHOW_MORE_INCREMENT)}
                    className="rounded-full border border-border/70 bg-background px-5 py-2 text-sm font-semibold text-accent transition hover:bg-soft-rose/35"
                  >
                    Show more ({ordered.length - visibleCount} older)
                  </button>
                </div>
              ) : ordered.length > INITIAL_VISIBLE_EVENTS ? (
                <p className="text-center text-[11px] text-muted">
                  Showing all {ordered.length} entr{ordered.length === 1 ? "y" : "ies"} in this view.
                </p>
              ) : null}
            </>
          )}

        </div>

        <aside className="sticky top-4 hidden min-w-0 self-start lg:block">
          <TimelineSidePanel
            sidebarHints={sidebarHints}
            worthTrackingShort={worthTrackingShort}
          />
        </aside>
      </div>
    </div>
  );
}

function TimelineSidePanel({
  sidebarHints,
  worthTrackingShort,
}: {
  sidebarHints: ReturnType<typeof buildMonthSidebarHighlights>;
  worthTrackingShort: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-border/50 bg-background/95 p-3 shadow-sm">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">This month</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-foreground">{sidebarHints.thisMonthLine}</p>
      </div>
      <div className="rounded-xl border border-border/50 bg-background/95 p-3 shadow-sm">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">Most common</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-foreground">{sidebarHints.mostCommonLine}</p>
      </div>
      <div className="rounded-xl border border-border/50 bg-background/95 p-3 shadow-sm">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">Worth tracking</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-foreground">{worthTrackingShort}</p>
      </div>
      <p className="text-center text-[10px] leading-snug text-muted">
        Educational only — not medical advice.
      </p>
    </div>
  );
}

function monthBreakdown(events: HealthTimelineEvent[]): string {
  let symptoms = 0;
  let medicines = 0;
  let cycles = 0;
  for (const ev of events) {
    if (ev.kind === "symptom") symptoms += 1;
    if (ev.kind === "medicine") medicines += 1;
    if (ev.kind === "cycle") cycles += 1;
  }
  return `${symptoms} symptoms · ${medicines} medicines · ${cycles} cycles`;
}

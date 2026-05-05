import type { ReactNode } from "react";

/** Vertical rhythm wrapper for app pages (inside `AppPageShell`). */
export function AppPage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex min-w-0 flex-col gap-5 sm:gap-8 ${className}`.trim()}>{children}</div>;
}

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  titleAs?: "h1" | "h2";
  subtitle?: ReactNode;
  /** Primary actions — full width on small screens, inline on `sm+`. */
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, titleAs = "h1", subtitle, actions }: PageHeaderProps) {
  const H = titleAs;
  return (
    <header className="min-w-0 space-y-3 sm:space-y-4">
      {eyebrow ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">{eyebrow}</p>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-2 sm:space-y-2.5">
          <H className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {title}
          </H>
          {subtitle ? (
            <div className="max-w-2xl text-sm leading-snug text-muted sm:text-base sm:leading-relaxed">
              {subtitle}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex w-full min-w-0 shrink-0 flex-col gap-2 sm:w-auto sm:max-w-md sm:flex-row sm:flex-wrap sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}

type ProductCardProps = {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
};

/** Default in-app card: surface, border, radius, shadow. */
export function ProductCard({ children, className = "", padding = "md" }: ProductCardProps) {
  const pad =
    padding === "sm" ? "p-3 sm:p-4" : padding === "lg" ? "p-4 sm:p-8" : "p-4 sm:p-6";
  return (
    <section
      className={`rounded-2xl border border-border/70 bg-surface/95 shadow-sm sm:rounded-3xl ${pad} ${className}`.trim()}
    >
      {children}
    </section>
  );
}

type SectionHeaderProps = {
  title: string;
  description?: ReactNode;
  /** Use `h3` when nested under a page-level `h1`. */
  as?: "h2" | "h3";
  className?: string;
};

export function SectionHeader({ title, description, as = "h2", className = "" }: SectionHeaderProps) {
  const Tag = as;
  return (
    <div className={`space-y-1.5 sm:space-y-2 ${className}`.trim()}>
      <Tag className="font-serif text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</Tag>
      {description ? <div className="text-sm text-muted sm:text-[15px]">{description}</div> : null}
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-border/80 bg-background/60 px-4 py-8 text-center sm:rounded-3xl sm:py-10 ${className}`.trim()}
    >
      <p className="font-serif text-base font-semibold text-foreground sm:text-lg">{title}</p>
      {description ? <div className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</div> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

type LoadingStateProps = {
  /** Number of skeleton rows */
  rows?: number;
  className?: string;
};

export function LoadingState({ rows = 4, className = "" }: LoadingStateProps) {
  return (
    <div
      className={`space-y-3 rounded-2xl border border-border/60 bg-surface/80 p-4 sm:p-6 ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="h-5 w-48 max-w-[85%] animate-pulse rounded bg-border/70" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-3 w-full animate-pulse rounded bg-border/50" />
      ))}
    </div>
  );
}

type ResponsiveGridProps = {
  children: ReactNode;
  /** `2` = 1 col mobile, 2 from sm. `3` = 1 / 2 / 3 from lg. */
  columns?: 2 | 3;
  className?: string;
};

export function ResponsiveGrid({ children, columns = 2, className = "" }: ResponsiveGridProps) {
  const cols =
    columns === 3
      ? "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
      : "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4";
  return <div className={`${cols} ${className}`.trim()}>{children}</div>;
}

/** Horizontal scroll for filter chips (hide scrollbar, keep touch scroll). */
export function FilterChipsRow({ children, className = "", label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <div
      className={`-mx-1 flex min-w-0 flex-nowrap gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:overflow-x-visible lg:px-0 ${className}`.trim()}
      role={label ? "toolbar" : undefined}
      aria-label={label}
    >
      {children}
    </div>
  );
}

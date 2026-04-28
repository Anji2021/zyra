type CompanionPanelProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  /** Use a single `h1` per page for accessibility (default `h2`). */
  titleLevel?: 1 | 2;
};

/** Soft container for in-product sections — avoids “admin card” density. */
export function CompanionPanel({
  eyebrow,
  title,
  description,
  children,
  titleLevel = 2,
}: CompanionPanelProps) {
  const HeadingTag = titleLevel === 1 ? "h1" : "h2";

  return (
    <section className="rounded-2xl border border-border/60 bg-surface/90 p-4 shadow-sm sm:rounded-3xl sm:p-8">
      {eyebrow ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent sm:text-xs">
          {eyebrow}
        </p>
      ) : null}
      <HeadingTag className="mt-1.5 font-serif text-xl font-semibold tracking-tight text-foreground sm:mt-2 sm:text-2xl">
        {title}
      </HeadingTag>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:mt-3 sm:text-base">
        {description}
      </p>
      {children ? <div className="mt-4 sm:mt-6">{children}</div> : null}
    </section>
  );
}

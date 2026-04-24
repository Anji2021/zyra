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
    <section className="rounded-3xl border border-border/60 bg-surface/90 p-6 shadow-sm sm:p-8">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
      ) : null}
      <HeadingTag className="mt-2 font-serif text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </HeadingTag>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        {description}
      </p>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}

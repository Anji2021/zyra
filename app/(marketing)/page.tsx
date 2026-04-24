import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { ZYRA } from "@/lib/zyra/site";

const features = [
  {
    title: "Private health profile",
    description:
      "Onboarding that respects your pace — cycle context, PCOS/PCOD notes, medicines, and background in one calm home.",
  },
  {
    title: "Cycle intelligence",
    description:
      "Period and symptom history that belongs to you, exportable when you want to share with a clinician.",
  },
  {
    title: "Medicines & symptoms",
    description:
      "A gentle timeline so patterns are easier to recall between visits — never a substitute for medical records.",
  },
  {
    title: "Trusted learning",
    description:
      "Resources on women’s health and PCOS/PCOD written for clarity, with citations and room for your questions.",
  },
  {
    title: "AI guidance, bounded",
    description:
      "Ask the Guide for general education and reflection. It will not diagnose or prescribe; it nudges you toward licensed care.",
  },
  {
    title: "Care discovery (roadmap)",
    description:
      "Find nearby specialists and, when you’re ready, move from search to booking — with privacy guardrails throughout.",
  },
];

export default function MarketingHomePage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <header className="border-b border-border/80 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="font-serif text-xl font-semibold tracking-tight text-foreground"
          >
            {ZYRA.name}
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-3 text-sm font-medium text-muted sm:gap-5">
            <a href="#story" className="transition-colors hover:text-foreground">
              Why {ZYRA.name}
            </a>
            <a href="#product" className="transition-colors hover:text-foreground">
              Product
            </a>
            <a href="#trust" className="transition-colors hover:text-foreground">
              Trust
            </a>
            <GoogleSignInButton variant="nav" label="Sign in with Google" />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-soft-rose/40 via-background to-background px-5 py-16 sm:px-8 sm:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-sage/15 blur-3xl"
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Privacy-first SaaS · Women’s health companion
            </p>
            <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              {ZYRA.name}: the calm place for your cycle, symptoms, and questions.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              {ZYRA.description}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <GoogleSignInButton variant="primary" label="Sign in with Google" />
              <a
                href="#product"
                className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-full border border-border bg-surface px-8 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-soft-rose/30"
              >
                Explore the product
              </a>
            </div>
          </div>
        </section>

        <section
          id="story"
          className="border-b border-border/60 bg-surface px-5 py-16 sm:px-8 sm:py-20"
        >
          <div className="mx-auto max-w-5xl">
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Built like a companion — secured like the SaaS you expect.
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted">
              {ZYRA.name} is designed for the long arc of care: daily check-ins, months of
              cycle data, and the occasional 2 a.m. question. That requires authenticated
              accounts, private storage, and transparent safety limits — not a brochure site
              with a login button bolted on.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {[
                {
                  title: "Your data, your boundaries",
                  body: "We orient flows around consent, clarity, and delete/export paths — because intimate health deserves adult privacy design.",
                },
                {
                  title: "Warmth without noise",
                  body: "No cluttered dashboards — just a soft shell that makes tracking, reading, and asking feel emotionally safe.",
                },
                {
                  title: "Clinicians stay in charge",
                  body: `${ZYRA.name} educates and organizes; it never replaces the judgment of someone licensed to care for you.`,
                },
              ].map((card) => (
                <article
                  key={card.title}
                  className="rounded-2xl border border-border bg-background p-6 shadow-sm"
                >
                  <h3 className="font-serif text-lg font-semibold text-foreground">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="product" className="px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-2xl">
              <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                What the Zyra product is becoming
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted">
                We are shipping in disciplined layers: identity and profile first, then
                tracking depth, then AI and care workflows. Each layer keeps the same
                promise — calm, private, and honest about limits.
              </p>
            </div>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2">
              {features.map((item) => (
                <li
                  key={item.title}
                  className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm"
                >
                  <h3 className="font-serif text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="trust"
          className="border-y border-border/80 bg-soft-rose/50 px-5 py-14 sm:px-8 sm:py-16"
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
              Medical disclaimer
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              {ZYRA.name} does not diagnose, treat, or replace a licensed clinician. If
              you have urgent symptoms — severe pain, heavy bleeding, pregnancy
              complications, chest pain, or thoughts of harming yourself — contact
              emergency services or a qualified professional immediately.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              Any AI guidance is for general education only. Decisions about medications,
              procedures, or your health belong to you and your medical team.
            </p>
            <p className="mt-6">
              <Link
                href="/legal/disclaimer"
                className="text-sm font-semibold text-accent underline-offset-2 hover:underline"
              >
                Read the full disclaimer
              </Link>
            </p>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-surface px-8 py-10 text-center shadow-sm">
            <h2 className="font-serif text-2xl font-semibold">Open your private space</h2>
            <p className="mt-3 text-muted">
              Sign in with Google to enter {ZYRA.name}. Your session stays yours; deeper sync
              and data controls will roll out in focused releases.
            </p>
            <div className="mt-8 flex justify-center">
              <GoogleSignInButton variant="primary" label="Sign in with Google" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface px-5 py-8 text-center text-sm text-muted sm:px-8">
        <p className="font-serif text-base font-semibold text-foreground">{ZYRA.name}</p>
        <p className="mt-2 mx-auto max-w-xl">
          A SaaS companion for women’s health — educational support, not a replacement for
          licensed medical care.
        </p>
        <p className="mt-4 text-xs text-muted/80">
          © {new Date().getFullYear()} {ZYRA.name}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

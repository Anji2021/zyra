import Link from "next/link";
import { ZYRA } from "@/lib/zyra/site";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <h1 className="font-serif text-2xl font-semibold text-foreground">
        {`We couldn't finish signing you in`}
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        The sign-in link may have expired, or something interrupted the flow. Please try
        again from the home page.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-accent px-8 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
      >
        Back to {ZYRA.name}
      </Link>
    </div>
  );
}

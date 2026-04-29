import type { Metadata } from "next";
import Link from "next/link";
import { ZYRA } from "@/lib/zyra/site";

export const metadata: Metadata = {
  title: `Terms of use — ${ZYRA.name}`,
  description: `Terms and conditions for using ${ZYRA.name}.`,
};

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-background px-5 py-10 text-foreground sm:px-8 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-semibold text-accent underline-offset-2 hover:underline">
          ← Back home
        </Link>
        <h1 className="mt-8 font-serif text-3xl font-semibold tracking-tight">Terms of use</h1>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted sm:text-base">
          <p>
            By using {ZYRA.name}, you agree to use it as an educational and organizational companion, not as
            a replacement for licensed medical care.
          </p>
          <p>
            You are responsible for safeguarding your account and for decisions made from information in the
            product.
          </p>
          <p>
            {ZYRA.name} may update features and policies over time; continued use means acceptance of current
            terms.
          </p>
        </div>
      </div>
    </div>
  );
}

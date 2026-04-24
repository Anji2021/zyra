import type { Metadata } from "next";
import Link from "next/link";
import { ZYRA, defaultTitle } from "@/lib/zyra/site";

export const metadata: Metadata = {
  title: `Medical disclaimer — ${defaultTitle}`,
  description: `${ZYRA.name} medical disclaimer and limitations of use.`,
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-dvh bg-background px-5 py-10 text-foreground sm:px-8 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-sm font-semibold text-accent underline-offset-2 hover:underline"
        >
          ← Back home
        </Link>
        <h1 className="mt-8 font-serif text-3xl font-semibold tracking-tight">
          Medical disclaimer
        </h1>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted sm:text-base">
          <p>
            <span className="font-semibold text-foreground">{ZYRA.name}</span> is a software
            product intended to provide general educational information about {`women's`}{" "}
            health topics. It does not provide medical advice, diagnosis, or treatment.
          </p>
          <p>
            Always seek the advice of your physician or other qualified health provider with
            any questions you may have regarding a medical condition. Never disregard
            professional medical advice or delay in seeking it because of something you
            have read or experienced in {ZYRA.name}.
          </p>
          <p>
            If you think you may have a medical emergency, call your doctor or emergency
            services immediately. {ZYRA.name} is not designed for emergency use.
          </p>
          <p>
            Any AI-generated content in {ZYRA.name} is informational only, may be incomplete
            or incorrect, and is not a substitute for individualized clinical judgment.
          </p>
          <p>
            Reliance on any information provided by {ZYRA.name}, its employees, or others
            appearing in the product is solely at your own risk.
          </p>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ZYRA } from "@/lib/zyra/site";

export const metadata: Metadata = {
  title: `Privacy policy — ${ZYRA.name}`,
  description: `How ${ZYRA.name} handles privacy and personal health information.`,
};

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-background px-5 py-10 text-foreground sm:px-8 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-semibold text-accent underline-offset-2 hover:underline">
          ← Back home
        </Link>
        <h1 className="mt-8 font-serif text-3xl font-semibold tracking-tight">Privacy policy</h1>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted sm:text-base">
          <p>
            {ZYRA.name} is built to keep your health information private and only visible to your account.
          </p>
          <p>
            We use your data to provide product features like cycle tracking, symptom logs, reminders, and
            personalization. We do not position this product as diagnosis or treatment.
          </p>
          <p>
            You can request updates or removal of your information according to your account controls and
            applicable law.
          </p>
        </div>
      </div>
    </div>
  );
}

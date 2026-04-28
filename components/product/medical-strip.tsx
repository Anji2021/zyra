import Link from "next/link";
import { ZYRA } from "@/lib/zyra/site";

export function MedicalStrip() {
  return (
    <div className="border-b border-border/80 bg-surface/95 px-2 py-1.5 text-center text-[10px] leading-snug text-muted sm:px-3 sm:py-2 sm:text-xs">
      <span>{ZYRA.name} provides educational information only and is not medical advice. </span>
      <Link
        href="/legal/disclaimer"
        className="whitespace-nowrap font-semibold text-accent underline-offset-2 hover:underline"
      >
        Full disclaimer
      </Link>
    </div>
  );
}

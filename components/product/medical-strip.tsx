import Link from "next/link";
import { ZYRA } from "@/lib/zyra/site";

export function MedicalStrip() {
  return (
    <div className="border-b border-border/80 bg-surface/95 px-3 py-2 text-center text-[11px] leading-snug text-muted sm:text-xs">
      <span className="font-medium text-foreground/90">{ZYRA.name}</span>{" "}
      <span className="hidden sm:inline">{ZYRA.legalShort} </span>
      <span className="sm:hidden">Not a doctor. Educational only. </span>
      <Link
        href="/legal/disclaimer"
        className="whitespace-nowrap font-semibold text-accent underline-offset-2 hover:underline"
      >
        Full disclaimer
      </Link>
    </div>
  );
}

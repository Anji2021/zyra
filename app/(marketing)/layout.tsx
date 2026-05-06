import { Suspense } from "react";
import { MarketingAuthMessages } from "@/components/auth/marketing-auth-messages";
import { MarketingAuthShell } from "@/components/auth/marketing-auth-shell";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketingAuthShell>
      <div className="flex min-h-dvh flex-col">
        <Suspense fallback={null}>
          <MarketingAuthMessages />
        </Suspense>
        {children}
      </div>
    </MarketingAuthShell>
  );
}

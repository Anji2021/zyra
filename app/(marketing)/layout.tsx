import { Suspense } from "react";
import { MarketingAuthMessages } from "@/components/auth/marketing-auth-messages";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Suspense fallback={null}>
        <MarketingAuthMessages />
      </Suspense>
      {children}
    </div>
  );
}

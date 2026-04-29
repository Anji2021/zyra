import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ProductShell } from "@/components/product/product-shell";
import { getProfileForUser } from "@/lib/profiles/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const avatarUrl =
    (typeof meta?.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta?.picture === "string" && meta.picture) ||
    null;
  const googleName =
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    null;

  const profile = await getProfileForUser(supabase, user.id);
  const shellDisplayName =
    profile?.full_name?.trim() || googleName || user.email?.split("@")[0] || null;

  return (
    <ProductShell
      userEmail={user.email ?? null}
      userDisplayName={shellDisplayName}
      userAvatarUrl={avatarUrl}
    >
      {children}
    </ProductShell>
  );
}

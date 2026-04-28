import { CompanionPanel } from "@/components/product/companion-panel";
import { createClient } from "@/lib/supabase/server";
import { FeedbackForm } from "./feedback-form";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  type RecentRow = { id: string; type: string; title: string; status: string | null };
  let recent: RecentRow[] = [];
  if (user) {
    const { data, error } = await supabase
      .from("feedback_requests")
      .select("id, type, title, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) {
      console.error("[feedback page] list error:", error.message);
    } else if (data) {
      recent = data as RecentRow[];
    }
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-8">
      <CompanionPanel
        eyebrow="Zyra"
        titleLevel={1}
        title="Feedback"
        description="Share ideas, report issues, or request topics. You need to be signed in; submissions are stored with your account only."
      >
        {user ? (
          <div className="space-y-10">
            <FeedbackForm />

            {recent.length > 0 ? (
              <div className="space-y-3 border-t border-border/60 pt-8">
                <h2 className="font-serif text-lg font-semibold text-foreground">Your recent notes</h2>
                <p className="text-xs text-muted">
                  Only you can see these (private to your account).
                </p>
                <ul className="space-y-3">
                  {recent.map((row) => (
                    <li
                      key={row.id}
                      className="rounded-2xl border border-border/70 bg-surface/80 px-4 py-3 text-sm"
                    >
                      <p className="font-medium text-foreground">{row.title}</p>
                      <p className="mt-1 text-xs text-muted">
                        {row.type.replace(/_/g, " ")} · {row.status ?? "new"}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted">Sign in from the home page to send feedback.</p>
        )}
      </CompanionPanel>
    </div>
  );
}

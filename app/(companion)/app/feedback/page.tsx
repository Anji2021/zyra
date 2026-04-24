import { CompanionPanel } from "@/components/product/companion-panel";
import { FeedbackForm } from "./feedback-form";

export const dynamic = "force-dynamic";

export default function FeedbackPage() {
  return (
    <div className="flex flex-col gap-8">
      <CompanionPanel
        eyebrow="Zyra"
        titleLevel={1}
        title="Feedback & requests"
        description="Share what is working, what feels confusing, or a topic you would like covered in Resources. Submissions are stored in your InsForge project (not in Supabase)."
      >
        <FeedbackForm />
      </CompanionPanel>
    </div>
  );
}

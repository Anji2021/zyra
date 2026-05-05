import { AppPage, PageHeader, ProductCard } from "@/components/product/page-system";
import { resources } from "@/data/resources";
import { GLOBAL_MEDICAL_DISCLAIMER } from "@/lib/zyra/medical-disclaimer";
import { ZYRA } from "@/lib/zyra/site";
import { ResourcesExplorer } from "./resources-explorer";

export const dynamic = "force-static";

export default function ResourcesPage() {
  return (
    <AppPage>
      <PageHeader
        eyebrow="Learn"
        title="Resources"
        subtitle={
          <>
            Short reads you can trust — written for clarity, not clicks. {ZYRA.name} does not replace your clinician;
            these pages help you feel a little more prepared.
          </>
        }
      />

      <ProductCard padding="sm">
        <p className="text-center text-[11px] leading-relaxed text-muted sm:text-xs">{GLOBAL_MEDICAL_DISCLAIMER}</p>
      </ProductCard>

      <ResourcesExplorer articles={resources} />
    </AppPage>
  );
}

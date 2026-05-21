import { Boxes, ClipboardList, Factory, FileWarning, Map, PackageOpen } from "lucide-react";
import { DataConnectionGate } from "@/components/layout/DataConnectionGate";
import { KpiCard } from "@/components/ui/KpiCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getExecutiveSummary } from "@/lib/data/factory";

export const dynamic = "force-dynamic";

export default async function ExecutiveCommandCenterPage() {
  const summary = await getExecutiveSummary();

  return (
    <>
      <SectionHeader
        eyebrow="Executive Command Center"
        title="Management view"
        description="Real counts from the factory foundation tables. Performance, efficiency, lost minutes, and risk scores are intentionally withheld until real operational feeds are wired."
      />
      <DataConnectionGate result={summary}>
        {(data) => (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <KpiCard
              label="Active groups"
              value={data.activeGroups}
              helper="From production_groups"
              icon={<Map className="h-5 w-5" aria-hidden="true" />}
            />
            <KpiCard
              label="Production lines"
              value={data.productionLines}
              helper="From production_lines"
              icon={<Factory className="h-5 w-5" aria-hidden="true" />}
            />
            <KpiCard
              label="Orders"
              value={data.orders}
              helper="From orders"
              icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />}
            />
            <KpiCard
              label="Material readiness rows"
              value={data.materialReadinessRows}
              helper="From material_readiness"
              icon={<Boxes className="h-5 w-5" aria-hidden="true" />}
            />
            <KpiCard
              label="WIP readiness rows"
              value={data.wipReadinessRows}
              helper="From wip_readiness"
              icon={<PackageOpen className="h-5 w-5" aria-hidden="true" />}
            />
            <KpiCard
              label="Imports requiring review"
              value={data.importBatchesRequiringReview}
              helper="Conflicts, pending approval, or failed"
              icon={<FileWarning className="h-5 w-5" aria-hidden="true" />}
            />
          </div>
        )}
      </DataConnectionGate>
    </>
  );
}

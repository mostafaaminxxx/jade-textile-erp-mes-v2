import { Boxes, PackageOpen, Shirt } from "lucide-react";
import { DataConnectionGate } from "@/components/layout/DataConnectionGate";
import { KpiCard } from "@/components/ui/KpiCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import {
  getMaterialReadinessSummary,
  getWipReadinessSummary,
} from "@/lib/data/factory";

export const dynamic = "force-dynamic";

export default async function MaterialWipReadinessPage() {
  const [material, wip] = await Promise.all([
    getMaterialReadinessSummary(),
    getWipReadinessSummary(),
  ]);

  return (
    <>
      <SectionHeader
        eyebrow="Material & WIP Readiness"
        title="Readiness control"
        description="Real summaries from material_readiness, wip_readiness, fabric_stock_items, and cut_panel_wip. Charts are deferred until real metrics are approved."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <DataConnectionGate result={material}>
          {(data) => (
            <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <KpiCard
                  label="Material readiness rows"
                  value={data.totalRows}
                  icon={<Boxes className="h-5 w-5" aria-hidden="true" />}
                />
                <KpiCard
                  label="Fabric stock rows"
                  value={data.fabricStockRows ?? 0}
                  icon={<Shirt className="h-5 w-5" aria-hidden="true" />}
                />
              </div>
              <ReadinessDistribution title="Material status distribution" data={data} />
            </section>
          )}
        </DataConnectionGate>

        <DataConnectionGate result={wip}>
          {(data) => (
            <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <KpiCard
                  label="WIP readiness rows"
                  value={data.totalRows}
                  icon={<PackageOpen className="h-5 w-5" aria-hidden="true" />}
                />
                <KpiCard
                  label="Cut panel WIP rows"
                  value={data.cutPanelRows ?? 0}
                  icon={<Boxes className="h-5 w-5" aria-hidden="true" />}
                />
              </div>
              <ReadinessDistribution title="WIP status distribution" data={data} />
            </section>
          )}
        </DataConnectionGate>
      </div>
    </>
  );
}

function ReadinessDistribution({
  title,
  data,
}: {
  title: string;
  data: {
    distribution: Array<{ status: string; count: number }>;
  };
}) {
  return (
    <div className="mt-5">
      <h2 className="text-lg font-bold text-jade-ink">{title}</h2>
      <div className="mt-3 space-y-3">
        {data.distribution.map((item) => (
          <div
            key={item.status}
            className="flex items-center justify-between border-b border-slate-100 pb-2"
          >
            <StatusChip status={item.status} />
            <span className="text-sm font-bold text-jade-ink">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

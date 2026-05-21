import { Boxes, PackageOpen, Shirt } from "lucide-react";
import { DataConnectionGate } from "@/components/layout/DataConnectionGate";
import { KpiCard } from "@/components/ui/KpiCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { getMaterialWipReadinessData } from "@/lib/data/factory";

export const dynamic = "force-dynamic";

export default async function MaterialWipReadinessPage() {
  const summary = await getMaterialWipReadinessData();

  return (
    <>
      <SectionHeader
        eyebrow="Material & WIP Readiness"
        title="Readiness control"
        description="Real summaries from material_readiness, wip_readiness, fabric_stock_items, and cut_panel_wip. WIP feed data is not pushed to line cards until real line-order contexts exist."
      />

      <DataConnectionGate result={summary}>
        {(data) => (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Material readiness rows" value={data.material.totalRows} helper="From material_readiness" icon={<Boxes className="h-5 w-5" aria-hidden="true" />} />
              <KpiCard label="Fabric stock rows" value={data.material.fabricStockRows} helper="From fabric_stock_items" icon={<Shirt className="h-5 w-5" aria-hidden="true" />} />
              <KpiCard label="WIP readiness rows" value={data.wip.totalRows} helper="From wip_readiness" icon={<PackageOpen className="h-5 w-5" aria-hidden="true" />} />
              <KpiCard label="Cut panel rows" value={data.wip.cutPanelRows} helper="From cut_panel_wip" icon={<Boxes className="h-5 w-5" aria-hidden="true" />} />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Distribution title="Material readiness status" rows={data.material.readinessDistribution} />
              <Distribution title="Fabric status summary" rows={data.material.fabricStatusSummary} />
              <Distribution title="Accessory status summary" rows={data.material.accessoryStatusSummary} />
              <Distribution title="WIP readiness status" rows={data.wip.readinessDistribution} />
            </div>

            <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-jade-ink">
                Feed cover summary by customer / sewing type / sub type
              </h2>
              {data.wip.feedCoverSummary.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-jade-line text-xs uppercase text-jade-steel">
                        <th className="py-3 pr-4">Customer</th>
                        <th className="py-3 pr-4">Sewing type</th>
                        <th className="py-3 pr-4">Sub type</th>
                        <th className="py-3 pr-4">Rows</th>
                        <th className="py-3 pr-4">Avg feed</th>
                        <th className="py-3 pr-4">Avg cover days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.wip.feedCoverSummary.map((item) => (
                        <tr key={`${item.customerName}-${item.sewingType}-${item.subType}`} className="border-b border-slate-100">
                          <td className="py-3 pr-4 font-semibold text-jade-ink">{item.customerName}</td>
                          <td className="py-3 pr-4 text-jade-steel">{item.sewingType}</td>
                          <td className="py-3 pr-4 text-jade-steel">{item.subType}</td>
                          <td className="py-3 pr-4 text-jade-steel">{item.rows}</td>
                          <td className="py-3 pr-4 text-jade-steel">
                            {item.averageFeedPercent === null ? "Waiting" : `${item.averageFeedPercent}%`}
                          </td>
                          <td className="py-3 pr-4 text-jade-steel">
                            {item.averageFeedCoverDays ?? "Waiting"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-3 text-sm font-semibold text-jade-steel">
                  Waiting for real factory data.
                </p>
              )}
              <p className="mt-4 text-sm leading-6 text-jade-steel">
                WIP readiness is currently summarized by customer/sewing type/sub type.
                It will connect to line cards after real line-order contexts are assigned.
              </p>
            </section>
          </div>
        )}
      </DataConnectionGate>
    </>
  );
}

function Distribution({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ status: string; count: number }>;
}) {
  return (
    <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-jade-ink">{title}</h2>
      {rows.length > 0 ? (
        <div className="mt-4 space-y-3">
          {rows.map((item) => (
            <div key={item.status} className="flex items-center justify-between border-b border-slate-100 pb-2">
              <StatusChip status={item.status} />
              <span className="text-sm font-bold text-jade-ink">{item.count}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm font-semibold text-jade-steel">
          Waiting for real factory data.
        </p>
      )}
    </section>
  );
}

import {
  Boxes,
  ClipboardList,
  Database,
  Factory,
  FileWarning,
  Layers3,
  Map,
  PackageOpen,
} from "lucide-react";
import type { ReactNode } from "react";
import { DataConnectionGate } from "@/components/layout/DataConnectionGate";
import { KpiCard } from "@/components/ui/KpiCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { getExecutiveCommandCenterData } from "@/lib/data/factory";

export const dynamic = "force-dynamic";

export default async function ExecutiveCommandCenterPage() {
  const summary = await getExecutiveCommandCenterData();

  return (
    <>
      <SectionHeader
        eyebrow="Executive Command Center"
        title="Real database foundation"
        description="Real counts from Supabase only. Efficiency, production quantity, risk score, and downtime are intentionally withheld until those operational feeds are activated."
      />
      <DataConnectionGate result={summary}>
        {(data) => (
          <div className="space-y-6">
            <SummarySection title="Factory Structure">
              <KpiCard label="Groups" value={data.factoryStructure.groups} helper="From production_groups" icon={<Map className="h-5 w-5" aria-hidden="true" />} />
              <KpiCard label="Active groups" value={data.factoryStructure.activeGroups} helper="Active production_groups" icon={<Factory className="h-5 w-5" aria-hidden="true" />} />
              <KpiCard label="Ghost groups" value={data.factoryStructure.ghostGroups} helper="Inactive or ghost zones" icon={<Layers3 className="h-5 w-5" aria-hidden="true" />} />
              <KpiCard label="Production lines" value={data.factoryStructure.productionLines} helper="From production_lines" icon={<Factory className="h-5 w-5" aria-hidden="true" />} />
            </SummarySection>

            <SummarySection title="Planning">
              <KpiCard label="Orders" value={data.planning.orders} helper="From orders" icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />} />
              <KpiCard label="Production plans" value={data.planning.productionPlans} helper="From production_plans" icon={<Database className="h-5 w-5" aria-hidden="true" />} />
              <KpiCard label="Operation routes" value={data.planning.orderOperationRoutes} helper="From order_operation_routes" icon={<Layers3 className="h-5 w-5" aria-hidden="true" />} />
              <KpiCard label="Weekly plan rows" value={data.planning.weeklyPlanRows} helper="From production_plan_daily_quantities" icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />} />
            </SummarySection>

            <SummarySection title="Material & WIP">
              <KpiCard label="Material readiness rows" value={data.materialWip.materialReadinessRows} helper="From material_readiness" icon={<Boxes className="h-5 w-5" aria-hidden="true" />} />
              <KpiCard label="Fabric stock rows" value={data.materialWip.fabricStockRows} helper="From fabric_stock_items" icon={<PackageOpen className="h-5 w-5" aria-hidden="true" />} />
              <KpiCard label="Cut panel WIP rows" value={data.materialWip.cutPanelWipRows} helper="From cut_panel_wip" icon={<Boxes className="h-5 w-5" aria-hidden="true" />} />
              <KpiCard label="WIP readiness rows" value={data.materialWip.wipReadinessRows} helper="From wip_readiness" icon={<PackageOpen className="h-5 w-5" aria-hidden="true" />} />
            </SummarySection>

            <SummarySection title="Line Execution">
              <KpiCard label="Line current state rows" value={data.lineExecution.lineCurrentStateRows} helper="From line_current_state" icon={<Factory className="h-5 w-5" aria-hidden="true" />} />
              <KpiCard label="WAITING_FOR_DATA lines" value={data.lineExecution.waitingForDataLines} helper="Real current state value" icon={<Database className="h-5 w-5" aria-hidden="true" />} />
              <KpiCard label="Line-order contexts" value={data.lineExecution.lineOrderContexts} helper="From line_order_contexts" icon={<Layers3 className="h-5 w-5" aria-hidden="true" />} />
              <KpiCard label="Active contexts" value={data.lineExecution.activeLineOrderContexts} helper="No line assignment until real context exists" icon={<Layers3 className="h-5 w-5" aria-hidden="true" />} />
            </SummarySection>

            <SummarySection title="Imports">
              <KpiCard label="Import batches" value={data.imports.importBatches} helper="From import_batches" icon={<FileWarning className="h-5 w-5" aria-hidden="true" />} />
              <KpiCard label="Pending approval" value={data.imports.pendingApproval} helper="Real import status count" icon={<FileWarning className="h-5 w-5" aria-hidden="true" />} />
              <KpiCard label="Applied" value={data.imports.applied} helper="Real import status count" icon={<Database className="h-5 w-5" aria-hidden="true" />} />
              <KpiCard label="With conflicts" value={data.imports.conflicts} helper="Real import status count" icon={<FileWarning className="h-5 w-5" aria-hidden="true" />} />
            </SummarySection>

            <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-jade-ink">Foundation status</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {data.foundationStatus.map((item) => (
                  <div key={item.label} className="rounded-md border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-bold text-jade-ink">{item.label}</p>
                      <StatusChip status={item.state} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-jade-steel">{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </DataConnectionGate>
    </>
  );
}

function SummarySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-jade-ink">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  );
}

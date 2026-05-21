import type { ReactNode } from "react";
import type { LineCard } from "@/types/factory";
import { StatusChip } from "@/components/ui/StatusChip";

export function LineDetailDrawer({ line }: { line?: LineCard }) {
  return (
    <aside className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-jade-ink">Line detail</h2>
      {line ? (
        <div className="mt-4 space-y-5 text-sm text-jade-steel">
          <Section title="Line Identity">
            <DetailRow label="Line code" value={line.lineCode} strong />
            <DetailRow label="Group" value={line.groupCode ?? "Unassigned group"} />
            <DetailRow label="Garment type" value={line.garmentType} />
            <DetailRow label="Active" value={line.isActive ? "Active" : "Inactive"} />
            <DetailRow
              label="Special line"
              value={line.isSpecial ? "Special line" : "Standard line"}
            />
          </Section>

          <Section title="Current State">
            <div className="mb-2">
              <StatusChip status={line.status} />
            </div>
            <DetailRow label="Stop reason" value={line.stopReason ?? "None reported"} />
            <DetailRow
              label="Feed percent"
              value={line.feedPercent === null ? "Waiting" : `${line.feedPercent}%`}
            />
            <DetailRow
              label="Feed cover days"
              value={
                line.feedCoverDays === null ? "Waiting" : String(line.feedCoverDays)
              }
            />
            <DetailRow
              label="Quality hold"
              value={line.qualityHold ? "Quality hold" : "No quality hold"}
            />
            <DetailRow
              label="Shipment risk"
              value={line.shipmentRisk ?? "None reported"}
            />
            <DetailRow
              label="Last refreshed"
              value={line.lastRefreshedAt ?? "Waiting"}
            />
          </Section>

          <Section title="Active Order Context">
            {line.activeContext ? (
              <>
                <DetailRow
                  label="Order"
                  value={line.activeContext.orderCode ?? "Assigned context"}
                />
                <DetailRow
                  label="PO"
                  value={line.activeContext.poNumber ?? "Waiting"}
                />
                <DetailRow
                  label="Customer"
                  value={line.activeContext.customerName ?? "Waiting"}
                />
                <DetailRow
                  label="Style"
                  value={line.activeContext.styleCode ?? "Waiting"}
                />
                <DetailRow
                  label="Color"
                  value={line.activeContext.colorName ?? "Waiting"}
                />
                <DetailRow
                  label="Shipment date"
                  value={line.activeContext.shipmentDate ?? "Waiting"}
                />
                <DetailRow
                  label="SMV"
                  value={formatNumber(line.activeContext.smv)}
                />
                <DetailRow
                  label="Planned operators"
                  value={formatNumber(line.activeContext.plannedOperators)}
                />
                <DetailRow
                  label="Planned target per day"
                  value={formatNumber(line.activeContext.plannedTargetPerDay)}
                />
              </>
            ) : (
              <p className="leading-6">
                No active order context assigned yet. Planning must assign a real
                order to this line before line-level production/feed/shipment data
                appears.
              </p>
            )}
          </Section>

          <Section title="Material / WIP Link">
            <p className="leading-6">
              {line.activeContext
                ? "Material and WIP summaries can be interpreted through the assigned order context."
                : "Material and WIP data exists at order/customer/sewing-type level, but this line is not linked to an order yet."}
            </p>
          </Section>

          <Section title="Allowed Future Actions">
            <p className="leading-6">
              Production entry will be enabled after auth and role setup.
              Downtime entry will be enabled after downtime schema/workflow setup.
            </p>
          </Section>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-jade-steel">
          Select a line to inspect current state. No floor actions are enabled in
          this foundation visibility phase.
        </p>
      )}
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-black uppercase text-jade-ink">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function DetailRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span>{label}</span>
      <span className={strong ? "font-black text-jade-ink" : "font-semibold text-jade-ink"}>
        {value}
      </span>
    </div>
  );
}

function formatNumber(value: number | null) {
  return value === null ? "Waiting" : String(value);
}

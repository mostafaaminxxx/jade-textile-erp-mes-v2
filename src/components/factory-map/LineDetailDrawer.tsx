"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { StatusChip } from "@/components/ui/StatusChip";
import { cn } from "@/lib/utils";
import type { ActiveLineContext, LineCard } from "@/types/factory";

export function LineDetailDrawer({
  line,
  onClose,
}: {
  line?: LineCard | null;
  onClose: () => void;
}) {
  if (!line) {
    return null;
  }

  const assignmentStatus = getAssignmentStatus(line);
  const executionStatus = getExecutionStatus(line);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35">
      <button
        type="button"
        aria-label="Close line detail"
        className="hidden flex-1 cursor-default md:block"
        onClick={onClose}
      />
      <aside className="h-full w-full max-w-2xl overflow-y-auto border-l border-jade-line bg-white shadow-2xl">
        <header className="sticky top-0 z-10 border-b border-jade-line bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-jade-orange">
                Line detail / context review
              </p>
              <h2 className="mt-1 truncate text-2xl font-black text-jade-ink">
                {line.lineCode}
              </h2>
              <p className="mt-1 text-sm font-semibold text-jade-steel">
                {[line.groupCode, line.garmentType].filter(Boolean).join(" / ")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-jade-line text-jade-steel transition hover:text-jade-ink"
              aria-label="Close line detail"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatusChip status={line.status} />
            <AssignmentBadge status={assignmentStatus} />
            <ExecutionBadge status={executionStatus} />
          </div>
        </header>

        <div className="space-y-5 px-5 py-5">
          <StatusExplanation
            line={line}
            assignmentStatus={assignmentStatus}
            executionStatus={executionStatus}
          />

          <Section title="Line Identity">
            <DetailRow label="Line code" value={line.lineCode} strong />
            <DetailRow label="Group" value={line.groupCode ?? "Unassigned group"} />
            <DetailRow label="Group name" value={line.groupName ?? "Waiting"} />
            <DetailRow label="Line type" value={line.garmentType} />
            <DetailRow label="Active" value={line.isActive ? "Active" : "Inactive"} />
            <DetailRow
              label="Special line"
              value={line.isSpecial ? "Special line" : "Standard line"}
            />
            <DetailRow
              label="Operational status"
              value={line.status.replaceAll("_", " ")}
            />
          </Section>

          <Section title="Active Context">
            {line.activeContext ? (
              <ActiveContextDetails context={line.activeContext} />
            ) : (
              <p className="text-sm font-semibold leading-6 text-jade-steel">
                No active order context. This line is available for planning
                assignment.
              </p>
            )}
          </Section>

          <Section title="Planning Data">
            {line.activeContext ? (
              <>
                <DetailRow label="SMV" value={formatNumber(line.activeContext.smv)} />
                <DetailRow
                  label="Planned operators"
                  value={formatNumber(line.activeContext.plannedOperators)}
                />
                <DetailRow
                  label="Planned target per day"
                  value={formatNumber(line.activeContext.plannedTargetPerDay)}
                />
                <DetailRow
                  label="Shipment date"
                  value={line.activeContext.shipmentDate ?? "Waiting for planning values"}
                />
                <DetailRow
                  label="Order quantity"
                  value={formatNumber(line.activeContext.orderQuantity)}
                />
              </>
            ) : (
              <p className="text-sm font-semibold leading-6 text-jade-steel">
                Waiting for a real planning assignment.
              </p>
            )}
          </Section>

          <Section title="Material / WIP Readiness Snapshot">
            {line.activeContext ? (
              <>
                <DetailRow
                  label="Material status"
                  value={line.activeContext.materialReadinessStatus ?? "Waiting"}
                />
                <DetailRow
                  label="Fabric status"
                  value={line.activeContext.fabricStatus ?? "Waiting"}
                />
                <DetailRow
                  label="Accessory status"
                  value={line.activeContext.accessoryStatus ?? "Waiting"}
                />
                <DetailRow
                  label="WIP status"
                  value={line.activeContext.wipReadinessStatus ?? "Waiting"}
                />
                <p className="rounded-md border border-orange-100 bg-orange-50 px-3 py-2 text-sm font-semibold leading-6 text-orange-900">
                  {line.activeContext.wipReadinessHint ??
                    "Readiness is available at order/customer/style level, not pushed to line execution yet."}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold leading-6 text-jade-steel">
                Readiness is available at order/customer/style level, not pushed
                to line execution yet.
              </p>
            )}
          </Section>

          <Section title="Execution Safety">
            <DetailRow label="Feed percent" value={formatExecutionValue(line.feedPercent, "%")} />
            <DetailRow label="Feed cover days" value={formatExecutionValue(line.feedCoverDays)} />
            <DetailRow label="Actual today" value={formatExecutionValue(line.actualToday)} />
            <DetailRow label="Target today" value={formatExecutionValue(line.targetToday)} />
            <DetailRow label="Stop reason" value={line.stopReason ?? "None reported"} />
            <DetailRow
              label="Quality hold"
              value={line.qualityHold ? "Quality hold" : "No quality hold"}
            />
            <DetailRow label="Shipment risk" value={line.shipmentRisk ?? "None reported"} />
            <DetailRow label="Last refreshed" value={line.lastRefreshedAt ?? "Waiting"} />
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold leading-6 text-jade-steel">
              {line.feedPercent === null
                ? "Not started / no execution feed yet."
                : "Execution feed is present from real line current state data."}
            </p>
          </Section>

          <section className="rounded-lg border border-orange-100 bg-orange-50 p-4 text-sm font-semibold leading-6 text-orange-900">
            Assignment does not start production, does not change feed %, and
            does not mark the line running.
          </section>

          <Section title="Read-Only Future Actions">
            <div className="grid gap-3 sm:grid-cols-2">
              {getFutureActions(line).map((action) => (
                <button
                  key={action.label}
                  type="button"
                  disabled
                  title={action.helper}
                  className="min-h-11 rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-black text-slate-500"
                >
                  {action.label}
                  <span className="mt-1 block text-xs font-semibold">
                    {action.helper}
                  </span>
                </button>
              ))}
            </div>
          </Section>
        </div>
      </aside>
    </div>
  );
}

function getFutureActions(line: LineCard) {
  const startLabel =
    line.activeContext && line.status === "WAITING_FOR_DATA"
      ? "Start production - prepared, not enabled"
      : "Start production";

  return [
    {
      label: startLabel,
      helper: "Requires approved production execution RPC.",
    },
    {
      label: "Close / change assignment",
      helper: "Coming in a controlled workflow phase.",
    },
    {
      label: "Register downtime",
      helper: "Coming in a controlled workflow phase.",
    },
    {
      label: "Add production entry",
      helper: "Coming in a controlled workflow phase.",
    },
  ];
}

function StatusExplanation({
  line,
  assignmentStatus,
  executionStatus,
}: {
  line: LineCard;
  assignmentStatus: AssignmentStatus;
  executionStatus: ExecutionStatus;
}) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      <ExplanationCard
        label="Operational status"
        value={line.status.replaceAll("_", " ")}
        detail="Current state from line_current_state."
      />
      <ExplanationCard
        label="Assignment status"
        value={assignmentStatus}
        detail="Whether a real line_order_context is active."
      />
      <ExplanationCard
        label="Execution status"
        value={executionStatus}
        detail="Production execution is not started by assignment."
      />
    </section>
  );
}

function ActiveContextDetails({ context }: { context: ActiveLineContext }) {
  return (
    <>
      <DetailRow label="Context id" value={context.id} strong />
      <DetailRow label="Order" value={context.orderCode ?? "Assigned context"} />
      <DetailRow label="PO" value={context.poNumber ?? "Waiting"} />
      <DetailRow label="Customer" value={context.customerName ?? "Waiting"} />
      <DetailRow label="Style" value={context.styleCode ?? "Waiting"} />
      <DetailRow label="Color" value={context.colorName ?? "Waiting"} />
      <DetailRow label="Shipment date" value={context.shipmentDate ?? "Waiting"} />
      <DetailRow label="Context start" value={context.contextStartAt ?? "Waiting"} />
      <DetailRow label="Change reason" value={context.changeReason ?? "Waiting"} />
      <DetailRow label="Approved by" value={context.approvedBy ?? "Waiting"} />
      <DetailRow label="Approved at" value={context.approvedAt ?? "Waiting"} />
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-jade-line bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-black uppercase text-jade-ink">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function ExplanationCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-black uppercase text-jade-steel">{label}</p>
      <p className="mt-2 text-sm font-black text-jade-ink">{value}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-jade-steel">{detail}</p>
    </div>
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
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-jade-steel">{label}</span>
      <span
        className={cn(
          "max-w-[65%] break-words text-right font-semibold text-jade-ink",
          strong && "font-black",
        )}
      >
        {value}
      </span>
    </div>
  );
}

type AssignmentStatus = "Assigned" | "Available" | "Not assignable";
type ExecutionStatus =
  | "Not started"
  | "Waiting for execution data"
  | "Running"
  | "Stopped";

function getAssignmentStatus(line: LineCard): AssignmentStatus {
  if (line.activeContext) {
    return "Assigned";
  }

  if (!line.isActive || line.isSpecial || line.groupCode === "G-11") {
    return "Not assignable";
  }

  return "Available";
}

function getExecutionStatus(line: LineCard): ExecutionStatus {
  if (!line.activeContext) {
    return "Not started";
  }

  if (line.status === "RUNNING") {
    return "Running";
  }

  if (["STOPPED", "CHANGEOVER", "QUALITY_HOLD", "NO_FEEDING"].includes(line.status)) {
    return "Stopped";
  }

  return "Waiting for execution data";
}

function AssignmentBadge({ status }: { status: AssignmentStatus }) {
  const className =
    status === "Assigned"
      ? "border-blue-200 bg-blue-50 text-blue-800"
      : status === "Available"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-slate-200 bg-slate-100 text-slate-600";

  return <Badge className={className}>{status}</Badge>;
}

function ExecutionBadge({ status }: { status: ExecutionStatus }) {
  const className =
    status === "Running"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "Stopped"
        ? "border-red-200 bg-red-50 text-red-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return <Badge className={className}>{status}</Badge>;
}

function Badge({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase leading-none",
        className,
      )}
    >
      {children}
    </span>
  );
}

function formatNumber(value: number | null | undefined) {
  return value == null ? "Waiting for planning values" : String(value);
}

function formatExecutionValue(value: number | null | undefined, suffix = "") {
  return value == null ? "Not started / no execution feed yet" : `${value}${suffix}`;
}

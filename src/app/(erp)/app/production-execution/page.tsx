"use client";

import { AlertTriangle, LockKeyhole, PlayCircle } from "lucide-react";
import { AuthenticatedDataGate } from "@/components/layout/AuthenticatedDataGate";
import { KpiCard } from "@/components/ui/KpiCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { getLineCards } from "@/lib/data/factory";
import type { LineCard } from "@/types/factory";

type ExecutionReadinessStatus =
  | "NOT_STARTED"
  | "WAITING_FOR_EXECUTION_DATA"
  | "READY_TO_START"
  | "RUNNING"
  | "PAUSED_STOPPED"
  | "QUALITY_HOLD"
  | "NO_FEEDING";

type AssignmentStatus = "AVAILABLE" | "ASSIGNED" | "NOT_ASSIGNABLE";

type ExecutionLine = LineCard & {
  assignmentStatus: AssignmentStatus;
  executionReadinessStatus: ExecutionReadinessStatus;
  executionReadinessBlockers: string[];
};

export default function ProductionExecutionPage() {
  return (
    <>
      <SectionHeader
        eyebrow="Production Execution"
        title="Execution readiness center"
        description="Read-only production execution foundation. Start, downtime, quality, and feed workflows are prepared for review but remain disabled."
      />

      <AuthenticatedDataGate queryName="production execution readiness" load={getLineCards}>
        {(lines) => {
          const executionLines = lines.map(toExecutionLine);
          const readyLines = executionLines.filter(
            (line) => line.executionReadinessStatus === "READY_TO_START",
          );
          const blockedLines = executionLines.filter(
            (line) => line.executionReadinessBlockers.length > 0,
          );

          return (
            <div className="space-y-6">
              <section className="rounded-lg border border-orange-100 bg-orange-50 p-5 text-sm font-semibold leading-6 text-orange-950">
                Production start is disabled in this phase. No line can be marked RUNNING from this screen yet,
                and no feed percent, feed cover days, actuals, targets, downtime, or production entries are created.
              </section>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <KpiCard label="Total lines" value={executionLines.length} helper="Real production lines" />
                <KpiCard
                  label="Assigned lines"
                  value={executionLines.filter((line) => line.assignmentStatus === "ASSIGNED").length}
                  helper="Active line-order contexts"
                />
                <KpiCard label="Ready to start" value={readyLines.length} helper="Derived readiness only" />
                <KpiCard label="Running sessions" value={0} helper="Future table not applied" />
                <KpiCard label="Blocked lines" value={blockedLines.length} helper="Lines with readiness blockers" />
              </div>

              <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <PlayCircle className="mt-1 h-5 w-5 text-jade-blue" aria-hidden="true" />
                  <div>
                    <h2 className="text-lg font-black text-jade-ink">Assigned lines ready for execution</h2>
                    <p className="mt-1 text-sm leading-6 text-jade-steel">
                      These lines have a real active context and are still waiting for execution data.
                      The button is intentionally disabled until migration and RPC approval.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {readyLines.map((line) => (
                    <ExecutionLineCard key={line.id} line={line} mode="ready" />
                  ))}
                  {readyLines.length === 0 ? (
                    <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm font-semibold text-jade-steel">
                      No assigned line is currently ready to start.
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-1 h-5 w-5 text-jade-orange" aria-hidden="true" />
                  <div>
                    <h2 className="text-lg font-black text-jade-ink">Lines not ready</h2>
                    <p className="mt-1 text-sm leading-6 text-jade-steel">
                      Blockers are derived from real line status, assignment context, and protected groups.
                      Future execution sessions are not applied yet.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {blockedLines.slice(0, 24).map((line) => (
                    <ExecutionLineCard key={line.id} line={line} mode="blocked" />
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-blue-100 bg-blue-50 p-5 text-sm font-semibold leading-6 text-blue-950">
                <p>Production execution session tables are not applied yet; running sessions are shown as 0.</p>
                <p>Production start is disabled in this phase.</p>
                <p>No line can be marked RUNNING from this screen yet.</p>
              </section>
            </div>
          );
        }}
      </AuthenticatedDataGate>
    </>
  );
}

function toExecutionLine(line: LineCard): ExecutionLine {
  const isNotAssignable = !line.isActive || line.isSpecial || line.groupCode === "G-11";
  const blockers: string[] = [];

  if (!line.activeContext) blockers.push("No active context");
  if (!line.isActive) blockers.push("Inactive line");
  if (line.isSpecial) blockers.push("Special line");
  if (line.groupCode === "G-11") blockers.push("Ghost or inactive line group");

  if (line.activeContext && line.status !== "WAITING_FOR_DATA") {
    blockers.push(`Operational status is ${line.status.replaceAll("_", " ")}`);
  }

  const canStart =
    Boolean(line.activeContext) &&
    line.status === "WAITING_FOR_DATA" &&
    !isNotAssignable;

  return {
    ...line,
    assignmentStatus: line.activeContext
      ? "ASSIGNED"
      : isNotAssignable
        ? "NOT_ASSIGNABLE"
        : "AVAILABLE",
    executionReadinessStatus: getExecutionReadinessStatus(line, canStart),
    executionReadinessBlockers: blockers,
  };
}

function getExecutionReadinessStatus(
  line: LineCard,
  canStart: boolean,
): ExecutionReadinessStatus {
  if (line.status === "RUNNING") return "RUNNING";
  if (line.status === "STOPPED") return "PAUSED_STOPPED";
  if (line.status === "QUALITY_HOLD") return "QUALITY_HOLD";
  if (line.status === "NO_FEEDING") return "NO_FEEDING";
  if (!line.activeContext) return "NOT_STARTED";
  if (canStart) return "READY_TO_START";
  return "WAITING_FOR_EXECUTION_DATA";
}

function ExecutionLineCard({
  line,
  mode,
}: {
  line: ExecutionLine;
  mode: "ready" | "blocked";
}) {
  const context = line.activeContext;

  return (
    <article className="rounded-lg border border-jade-line bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl font-black text-jade-ink">{line.lineCode}</p>
          <p className="mt-1 text-sm font-semibold text-jade-steel">
            {[line.groupCode, line.garmentType].filter(Boolean).join(" / ")}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <StatusChip status={line.status} />
          <StatusChip status={line.executionReadinessStatus} />
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-sm text-jade-steel sm:grid-cols-2">
        <Detail label="Assignment" value={line.assignmentStatus.replaceAll("_", " ")} />
        <Detail label="Customer" value={context?.customerName ?? "No active context"} />
        <Detail label="Style" value={context?.styleCode ?? "Waiting"} />
        <Detail label="Color" value={context?.colorName ?? "Waiting"} />
        <Detail label="Shipment" value={context?.shipmentDate ?? "Waiting"} />
        <Detail
          label="Feed percent"
          value={line.feedPercent === null ? "No execution feed" : `${line.feedPercent}%`}
        />
      </dl>

      {mode === "blocked" ? (
        <div className="mt-4 space-y-2">
          {line.executionReadinessBlockers.map((blocker) => (
            <p
              key={blocker}
              className="rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-jade-steel"
            >
              {blocker}
            </p>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        disabled
        title="Start production workflow is prepared but not enabled until migration/RPC approval."
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-black text-slate-500"
      >
        <LockKeyhole className="h-4 w-4" aria-hidden="true" />
        Start production - prepared, not enabled
      </button>

      <p className="mt-2 text-xs font-semibold leading-5 text-jade-steel">
        Requires approved production execution RPC. This screen does not start production.
      </p>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt>{label}</dt>
      <dd className="text-right font-bold text-jade-ink">{value}</dd>
    </div>
  );
}

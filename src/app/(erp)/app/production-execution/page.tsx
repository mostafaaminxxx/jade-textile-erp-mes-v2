"use client";

import { AlertTriangle, History, LockKeyhole, PlayCircle } from "lucide-react";
import { AuthenticatedDataGate } from "@/components/layout/AuthenticatedDataGate";
import { KpiCard } from "@/components/ui/KpiCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import {
  getProductionExecutionReadinessData,
  type ProductionExecutionReadinessLine,
} from "@/lib/data/production-execution-readiness";

export default function ProductionExecutionPage() {
  return (
    <>
      <SectionHeader
        eyebrow="Production Execution"
        title="Execution readiness center"
        description="Read-only production execution foundation. Start, downtime, quality, and feed workflows are prepared for review but remain disabled."
      />
      <AuthenticatedDataGate
        queryName="production execution readiness"
        load={getProductionExecutionReadinessData}
      >
        {(readiness) => (
          <div className="space-y-6">
            <section className="rounded-lg border border-orange-100 bg-orange-50 p-5 text-sm font-semibold leading-6 text-orange-950">
              Production start is disabled in this phase. No line can be marked
              RUNNING from this screen yet, and no feed percent, feed cover days,
              actuals, targets, downtime, or production entries are created.
            </section>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <KpiCard label="Total lines" value={readiness.summary.totalLines} helper="Real production lines" />
              <KpiCard label="Assigned lines" value={readiness.summary.assignedLines} helper="Active line-order contexts" />
              <KpiCard label="Ready to start" value={readiness.summary.readyToStartLines} helper="Derived readiness only" />
              <KpiCard label="Running sessions" value={readiness.summary.runningSessions} helper="From execution schema" />
              <KpiCard label="Blocked lines" value={readiness.summary.blockedLines} helper="Lines with readiness blockers" />
            </div>

            <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-1 h-5 w-5 text-jade-blue" aria-hidden="true" />
                <div>
                  <h2 className="text-lg font-black text-jade-ink">Execution schema status</h2>
                  <p className="mt-1 text-sm leading-6 text-jade-steel">
                    Readiness comes from the real Supabase view. The RPC exists in the database, but this page remains read-only and does not call it.
                  </p>
                </div>
              </div>
              <dl className="mt-5 grid gap-3 text-sm text-jade-steel md:grid-cols-3 xl:grid-cols-5">
                <SchemaDetail
                  label="Readiness view"
                  value={readiness.schemaStatus.readinessViewAvailable ? "Available" : "Not readable"}
                />
                <SchemaDetail
                  label="Sessions table"
                  value={readiness.schemaStatus.sessionsTableAvailable ? "Available" : "Not readable"}
                />
                <SchemaDetail
                  label="Events table"
                  value={readiness.schemaStatus.eventsTableAvailable ? "Available" : "Not readable"}
                />
                <SchemaDetail
                  label="Sessions count"
                  value={String(readiness.schemaStatus.sessionsCount)}
                />
                <SchemaDetail
                  label="Events count"
                  value={String(readiness.schemaStatus.eventsCount)}
                />
              </dl>
            </section>

            <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <History className="mt-1 h-5 w-5 text-jade-blue" aria-hidden="true" />
                <div>
                  <h2 className="text-lg font-black text-jade-ink">Production execution history</h2>
                  <p className="mt-1 text-sm leading-6 text-jade-steel">
                    Read-only review of production execution sessions and events. The previous T20 backend-only test was strict-cleaned, so zero stored rows is expected.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <KpiCard label="Total sessions" value={readiness.schemaStatus.sessionsCount} helper="Stored execution sessions" />
                <KpiCard label="Active sessions" value={readiness.summary.runningSessions} helper="Sessions without end time" />
                <KpiCard label="Closed sessions" value={0} helper="No closed sessions stored yet" />
                <KpiCard label="Total events" value={readiness.schemaStatus.eventsCount} helper="Execution event log rows" />
                <KpiCard label="Latest event" value="None" helper="No stored event timestamp" />
              </div>

              <section className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm font-semibold leading-6 text-blue-950">
                Backend-only RPC test on T20 passed and was strict-cleaned. Current session/event tables are expected to be zero. See PRODUCTION_EXECUTION_RPC_TEST_PLAN.md and NEXT_STEPS.md for evidence.
              </section>

              <div className="mt-6 grid gap-5 xl:grid-cols-2">
                <HistoryEmptyPanel
                  title="Stored sessions"
                  message="No production execution sessions are currently stored. The previous T20 backend-only test was strict-cleaned, so this is expected."
                />
                <HistoryEmptyPanel
                  title="Event timeline"
                  message="No production execution events are currently stored. Future backend/frontend starts will appear here."
                />
              </div>

              <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-jade-steel">
                History is read-only. This page does not start, stop, close, or edit production sessions. Frontend start remains locked until Prompt 5E-7 or later approval.
              </section>
            </section>

            <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <PlayCircle className="mt-1 h-5 w-5 text-jade-blue" aria-hidden="true" />
                <div>
                  <h2 className="text-lg font-black text-jade-ink">Assigned lines ready for execution</h2>
                  <p className="mt-1 text-sm leading-6 text-jade-steel">
                    These lines have a real active context and the readiness view says they can be prepared for a future start test. READY_TO_START is not RUNNING.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {readiness.readyLines.map((line) => (
                  <ExecutionLineCard key={line.id} line={line} mode="ready" />
                ))}
                {readiness.readyLines.length === 0 ? (
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
                    Blockers come from the real readiness view: assignment context, operational state, group eligibility, and active execution sessions.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {readiness.blockedLines.slice(0, 24).map((line) => (
                  <ExecutionLineCard key={line.id} line={line} mode="blocked" />
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-blue-100 bg-blue-50 p-5 text-sm font-semibold leading-6 text-blue-950">
              {readiness.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
              <p>History is read-only. This page does not start, stop, close, or edit production sessions.</p>
            </section>
          </div>
        )}
      </AuthenticatedDataGate>
    </>
  );
}

function HistoryEmptyPanel({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-jade-blue" aria-hidden="true" />
        <h3 className="text-base font-black text-jade-ink">{title}</h3>
      </div>
      <div className="mt-4">
        <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm font-semibold leading-6 text-jade-steel">
          {message}
        </p>
      </div>
    </section>
  );
}

function ExecutionLineCard({
  line,
  mode,
}: {
  line: ProductionExecutionReadinessLine;
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
        <Detail label="Feed percent" value={line.feedPercent === null ? "No execution feed" : `${line.feedPercent}%`} />
      </dl>

      {mode === "blocked" ? (
        <div className="mt-4 space-y-2">
          {line.executionReadinessBlockers.map((blocker) => (
            <p key={blocker} className="rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-jade-steel">
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

function SchemaDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 px-4 py-3">
      <dt className="text-xs font-bold uppercase text-jade-steel">{label}</dt>
      <dd className="mt-1 text-base font-black text-jade-ink">{value}</dd>
    </div>
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

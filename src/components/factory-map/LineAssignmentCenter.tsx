"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Link2, Loader2, LockKeyhole, Search, X } from "lucide-react";
import type { LineAssignmentCenterData, LineAssignmentOrder, LineCard } from "@/types/factory";
import type { ProductionGroup, UserRole } from "@/types/database";
import { StatusChip } from "@/components/ui/StatusChip";
import { getCurrentUserRoleClient } from "@/lib/data/auth-client";
import { assignLineOrderContextClient } from "@/lib/data/line-assignment-client";
import { cn } from "@/lib/utils";

type LineTab = "available" | "assigned" | "all";
type AssignmentState = "available" | "assigned" | "not_assignable";

interface RoleState {
  isLoading: boolean;
  hasUser: boolean;
  role: UserRole | null;
  canWriteAssignment: boolean;
  message: string;
}

const INITIAL_ROLE_STATE: RoleState = {
  isLoading: true,
  hasUser: false,
  role: null,
  canWriteAssignment: false,
  message: "Checking assignment access.",
};

export function LineAssignmentCenter({ data }: { data: LineAssignmentCenterData }) {
  const router = useRouter();
  const [lineTab, setLineTab] = useState<LineTab>("available");
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [lineStatusFilter, setLineStatusFilter] = useState("ALL");
  const [lineSearch, setLineSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("ALL");
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [roleState, setRoleState] = useState<RoleState>(INITIAL_ROLE_STATE);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [changeReason, setChangeReason] = useState("Planning assignment");
  const [smv, setSmv] = useState("");
  const [plannedOperators, setPlannedOperators] = useState("");
  const [plannedTargetPerDay, setPlannedTargetPerDay] = useState("");
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
    contextId?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      const result = await getCurrentUserRoleClient();
      if (!cancelled) {
        setRoleState({
          isLoading: false,
          hasUser: Boolean(result.user),
          role: result.role,
          canWriteAssignment: result.canAssignLineOrderContext,
          message: result.message,
        });
      }
    }

    void loadRole();
    return () => {
      cancelled = true;
    };
  }, []);

  const groupByCode = useMemo(
    () => new Map(data.groups.map((group) => [group.group_code, group])),
    [data.groups],
  );
  const statuses = useMemo(
    () => Array.from(new Set(data.availableLines.map((line) => line.status))).sort(),
    [data.availableLines],
  );
  const customers = useMemo(
    () => Array.from(new Set(data.openOrders.map((order) => order.customerName))).sort(),
    [data.openOrders],
  );

  const lineCounts = useMemo(() => {
    const available = data.availableLines.filter((line) => getAssignmentState(line, groupByCode) === "available").length;
    const assigned = data.availableLines.filter((line) => line.activeContext).length;
    const waitingStatus = data.availableLines.filter((line) => line.status === "WAITING_FOR_DATA").length;
    return { total: data.availableLines.length, available, assigned, waitingStatus };
  }, [data.availableLines, groupByCode]);

  const filteredLines = data.availableLines.filter((line) => {
    const assignmentState = getAssignmentState(line, groupByCode);
    const matchesTab =
      lineTab === "all" ||
      (lineTab === "available" && assignmentState === "available") ||
      (lineTab === "assigned" && assignmentState === "assigned");
    const matchesGroup = groupFilter === "ALL" || line.groupCode === groupFilter;
    const matchesStatus = lineStatusFilter === "ALL" || line.status === lineStatusFilter;
    const searchable = `${line.lineCode} ${line.groupCode ?? ""} ${line.garmentType}`.toLowerCase();
    return matchesTab && matchesGroup && matchesStatus && searchable.includes(lineSearch.trim().toLowerCase());
  });

  const filteredOrders = data.openOrders.filter((order) => {
    const matchesCustomer = customerFilter === "ALL" || order.customerName === customerFilter;
    const searchable = [
      order.orderCode,
      order.poNumber,
      order.customerName,
      order.styleCode,
      order.colorName,
    ].filter(Boolean).join(" ").toLowerCase();
    return matchesCustomer && searchable.includes(orderSearch.trim().toLowerCase());
  });

  const selectedLine = data.availableLines.find((line) => line.id === selectedLineId);
  const selectedOrder = data.openOrders.find((order) => order.id === selectedOrderId);
  const disabledReason = getDisabledReason({
    line: selectedLine,
    order: selectedOrder,
    roleState,
    isSubmitting,
    profilesTotal: data.profileReadiness.profilesTotal,
  });
  const isReady = disabledReason === "Ready to create assignment.";

  async function handleConfirmAssignment() {
    if (!selectedLine || !selectedOrder || !isReady) {
      return;
    }

    const parsedSmv = parseOptionalNumber(smv);
    const parsedOperators = parseOptionalNumber(plannedOperators);
    const parsedTarget = parseOptionalNumber(plannedTargetPerDay);

    if (parsedSmv === false || parsedOperators === false || parsedTarget === false) {
      setSubmitMessage({ type: "error", text: "Optional planning fields must be valid numbers." });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    const result = await assignLineOrderContextClient({
      lineId: selectedLine.id,
      orderId: selectedOrder.id,
      smv: parsedSmv,
      plannedOperators: parsedOperators,
      plannedTargetPerDay: parsedTarget,
      changeReason,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setSubmitMessage({ type: "error", text: result.error });
      return;
    }

    setIsConfirming(false);
    setSubmitMessage({
      type: "success",
      text: "Assignment created. Line is now assigned, waiting for execution data.",
      contextId: result.contextId,
    });
    window.dispatchEvent(new Event("jade:refresh-real-data"));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Total real lines" value={lineCounts.total} />
        <Metric label="Available lines" value={lineCounts.available} />
        <Metric label="Assigned lines" value={lineCounts.assigned} />
        <Metric label="Waiting status lines" value={lineCounts.waitingStatus} />
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-blue-950">
        Assignment availability is separate from operational status. A line can be assigned and still show WAITING_FOR_DATA until real execution data is entered.
      </div>

      {submitMessage ? (
        <div className={cn("rounded-lg border px-4 py-3 text-sm font-semibold", submitMessage.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900")}>
          <p>{submitMessage.text}</p>
          {submitMessage.contextId ? <p className="mt-1 font-mono text-xs">Context id: {submitMessage.contextId}</p> : null}
        </div>
      ) : null}

      <div className="grid gap-6 2xl:grid-cols-[1fr_1fr_420px]">
        <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
          <PanelHeader title="Lines" subtitle="Real production lines only" />
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <TabButton active={lineTab === "available"} label="Available lines" count={lineCounts.available} onClick={() => setLineTab("available")} />
            <TabButton active={lineTab === "assigned"} label="Assigned lines" count={lineCounts.assigned} onClick={() => setLineTab("assigned")} />
            <TabButton active={lineTab === "all"} label="All lines" count={lineCounts.total} onClick={() => setLineTab("all")} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Select label="Group" value={groupFilter} onChange={setGroupFilter} options={["ALL", ...data.groups.map((group) => group.group_code)]} />
            <Select label="Status" value={lineStatusFilter} onChange={setLineStatusFilter} options={["ALL", ...statuses]} />
            <SearchField label="Line search" value={lineSearch} onChange={setLineSearch} placeholder="Line code" />
          </div>

          <div className="mt-5 max-h-[620px] space-y-3 overflow-auto pr-1">
            {filteredLines.map((line) => (
              <button
                key={line.id}
                type="button"
                onClick={() => setSelectedLineId(line.id)}
                className={cn("w-full rounded-md border p-4 text-left transition hover:border-jade-blue", selectedLineId === line.id ? "border-jade-blue bg-blue-50" : "border-slate-100 bg-white")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-jade-ink">{line.lineCode}</p>
                    <p className="mt-1 text-sm font-semibold text-jade-steel">{line.groupCode ?? "No group"} - {line.garmentType}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <AssignmentBadge state={getAssignmentState(line, groupByCode)} />
                    <StatusChip status={line.status} />
                  </div>
                </div>
                <dl className="mt-3 grid gap-2 text-sm text-jade-steel">
                  <Detail label="Operational status" value={line.status.replaceAll("_", " ")} />
                  <Detail label="Assignment status" value={getAssignmentLabel(line, groupByCode)} />
                  {line.activeContext ? (
                    <>
                      <Detail label="Active order" value={line.activeContext.orderCode ?? line.activeContext.poNumber ?? "Assigned"} />
                      <Detail label="Customer / style" value={[line.activeContext.customerName, line.activeContext.styleCode].filter(Boolean).join(" / ") || "Waiting"} />
                      <Detail label="Color" value={line.activeContext.colorName ?? "Waiting"} />
                    </>
                  ) : null}
                </dl>
              </button>
            ))}
            {filteredLines.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-jade-steel">
                No lines match this assignment view.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
          <PanelHeader title="Orders" subtitle="Real orders and readiness hints" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Select label="Customer" value={customerFilter} onChange={setCustomerFilter} options={["ALL", ...customers]} />
            <SearchField label="Order search" value={orderSearch} onChange={setOrderSearch} placeholder="Order, PO, style, color" />
          </div>
          <div className="mt-5 max-h-[620px] space-y-3 overflow-auto pr-1">
            {filteredOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelectedOrderId(order.id)}
                className={cn("w-full rounded-md border p-4 text-left transition hover:border-jade-blue", selectedOrderId === order.id ? "border-jade-blue bg-blue-50" : "border-slate-100 bg-white")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-black text-jade-ink">{order.orderCode}</p>
                    <p className="mt-1 text-sm font-semibold text-jade-steel">{order.customerName}</p>
                  </div>
                  <StatusChip status={order.materialReadinessStatus ?? "waiting"} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-jade-steel">
                  <Detail label="PO" value={order.poNumber ?? "Waiting"} />
                  <Detail label="Style" value={order.styleCode ?? "Waiting"} />
                  <Detail label="Color" value={order.colorName ?? "Waiting"} />
                  <Detail label="Shipment" value={order.shipmentDate ?? "Waiting"} />
                  <Detail label="Quantity" value={order.orderQuantity === null ? "Waiting" : String(order.orderQuantity)} />
                  <Detail label="WIP" value={order.wipMatchType === "none" ? "Waiting" : order.wipMatchType === "order" ? "Order linked" : "Needs confirmation"} />
                </dl>
              </button>
            ))}
          </div>
        </section>

        <AssignmentPreview
          line={selectedLine}
          order={selectedOrder}
          roleState={roleState}
          globalWarnings={data.warnings}
          disabledReason={disabledReason}
          groupByCode={groupByCode}
          onOpenConfirm={() => setIsConfirming(true)}
        />
      </div>

      {isConfirming && selectedLine && selectedOrder ? (
        <ConfirmDialog
          line={selectedLine}
          order={selectedOrder}
          changeReason={changeReason}
          smv={smv}
          plannedOperators={plannedOperators}
          plannedTargetPerDay={plannedTargetPerDay}
          isSubmitting={isSubmitting}
          onChangeReason={setChangeReason}
          onSmv={setSmv}
          onPlannedOperators={setPlannedOperators}
          onPlannedTargetPerDay={setPlannedTargetPerDay}
          onClose={() => !isSubmitting && setIsConfirming(false)}
          onConfirm={handleConfirmAssignment}
        />
      ) : null}
    </div>
  );
}

function AssignmentPreview({
  line,
  order,
  roleState,
  globalWarnings,
  disabledReason,
  groupByCode,
  onOpenConfirm,
}: {
  line?: LineCard;
  order?: LineAssignmentOrder;
  roleState: RoleState;
  globalWarnings: string[];
  disabledReason: string;
  groupByCode: Map<string, ProductionGroup>;
  onOpenConfirm: () => void;
}) {
  const hasActiveContext = Boolean(line?.activeContext);
  const isReady = disabledReason === "Ready to create assignment.";
  const statusLabel = hasActiveContext ? "Assignment blocked" : isReady ? "Ready to create assignment" : disabledReason;
  const warnings = [
    ...(hasActiveContext ? ["Selected line already has an active context."] : globalWarnings),
    ...(!line || hasActiveContext ? [] : [getAssignmentLabel(line, groupByCode)]),
    ...(order?.warnings ?? []),
    ...(hasActiveContext ? [] : ["WIP is not line-specific yet."]),
    "Assignment creates line context only. It does not start production, does not update feed %, and does not mark the line running.",
    ...(isReady || hasActiveContext ? [] : [roleState.message]),
  ];

  return (
    <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
      <PanelHeader title="Assignment preview" subtitle="User-selected assignment only" />
      <div className="mt-5 space-y-4">
        <div className={cn("rounded-md border px-4 py-3 text-sm font-black", isReady ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-orange-200 bg-orange-50 text-orange-900")}>
          {statusLabel}
        </div>
        <PreviewBlock title="Selected line">
          {line ? (
            <>
              <Detail label="Line" value={line.lineCode} />
              <Detail label="Group" value={line.groupCode ?? "No group"} />
              <Detail label="Operational status" value={line.status.replaceAll("_", " ")} />
              <Detail label="Assignment status" value={getAssignmentLabel(line, groupByCode)} />
              {line.activeContext ? (
                <>
                  <Detail label="Context id" value={line.activeContext.id} />
                  <Detail label="Order" value={line.activeContext.orderCode ?? line.activeContext.poNumber ?? "Assigned"} />
                  <Detail label="Customer" value={line.activeContext.customerName ?? "Waiting"} />
                  <Detail label="Style" value={line.activeContext.styleCode ?? "Waiting"} />
                  <Detail label="Color" value={line.activeContext.colorName ?? "Waiting"} />
                  <Detail label="Shipment" value={line.activeContext.shipmentDate ?? "Waiting"} />
                  <Detail label="Context start" value={line.activeContext.contextStartAt ?? "Waiting"} />
                </>
              ) : null}
            </>
          ) : (
            <p className="text-sm font-semibold text-jade-steel">Select an available line.</p>
          )}
        </PreviewBlock>
        <PreviewBlock title="Selected order">
          {order ? (
            <>
              <Detail label="Order" value={order.orderCode} />
              <Detail label="Customer" value={order.customerName} />
              <Detail label="Style" value={order.styleCode ?? "Waiting"} />
              <Detail label="Color" value={order.colorName ?? "Waiting"} />
              <Detail label="Shipment" value={order.shipmentDate ?? "Waiting"} />
              <Detail label="Material" value={order.materialReadinessStatus ?? "Waiting"} />
              <Detail label="WIP" value={order.wipReadinessHint ?? "Waiting"} />
            </>
          ) : (
            <p className="text-sm font-semibold text-jade-steel">Select a real order.</p>
          )}
        </PreviewBlock>
        <PreviewBlock title="Warnings">
          <ul className="space-y-2 text-sm font-semibold text-jade-steel">
            {Array.from(new Set(warnings)).map((warning) => (
              <li key={warning} className="rounded-md bg-orange-50 px-3 py-2 text-orange-900">{warning}</li>
            ))}
          </ul>
        </PreviewBlock>
        <button
          type="button"
          disabled={!isReady}
          onClick={onOpenConfirm}
          className={cn("flex min-h-12 w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-black transition", isReady ? "bg-jade-blue text-white hover:bg-blue-700" : "bg-slate-200 text-slate-600")}
        >
          {roleState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : isReady ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <LockKeyhole className="h-4 w-4" aria-hidden="true" />}
          Create assignment
        </button>
        <p className="text-sm leading-6 text-jade-steel">{disabledReason}</p>
        {hasActiveContext ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold leading-6 text-jade-steel">
            To change an assigned line, use a future planned Change Assignment workflow. Direct overwrite is blocked in this phase.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ConfirmDialog({
  line,
  order,
  changeReason,
  smv,
  plannedOperators,
  plannedTargetPerDay,
  isSubmitting,
  onChangeReason,
  onSmv,
  onPlannedOperators,
  onPlannedTargetPerDay,
  onClose,
  onConfirm,
}: {
  line: LineCard;
  order: LineAssignmentOrder;
  changeReason: string;
  smv: string;
  plannedOperators: string;
  plannedTargetPerDay: string;
  isSubmitting: boolean;
  onChangeReason: (value: string) => void;
  onSmv: (value: string) => void;
  onPlannedOperators: (value: string) => void;
  onPlannedTargetPerDay: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-lg border border-jade-line bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-jade-ink">Confirm line assignment</h2>
            <p className="mt-1 text-sm font-semibold text-jade-steel">This creates a real line context through the reviewed Supabase RPC.</p>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-md border border-jade-line p-2 text-jade-steel hover:text-jade-ink" aria-label="Close confirmation">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <PreviewBlock title="Line">
            <Detail label="Line code" value={line.lineCode} />
            <Detail label="Group" value={line.groupCode ?? "No group"} />
            <Detail label="Status" value={line.status.replaceAll("_", " ")} />
          </PreviewBlock>
          <PreviewBlock title="Order">
            <Detail label="Order" value={order.orderCode} />
            <Detail label="Customer" value={order.customerName} />
            <Detail label="Style" value={order.styleCode ?? "Waiting"} />
            <Detail label="Color" value={order.colorName ?? "Waiting"} />
            <Detail label="Shipment" value={order.shipmentDate ?? "Waiting"} />
            <Detail label="Material" value={order.materialReadinessStatus ?? "Waiting"} />
            <Detail label="WIP" value={order.wipReadinessHint ?? "Waiting"} />
          </PreviewBlock>
        </div>
        <div className="mt-5 rounded-md border border-orange-100 bg-orange-50 p-4 text-sm font-semibold leading-6 text-orange-900">
          Assignment creates line context only. It does not start production, does not update feed %, and does not mark the line running.
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <TextInput label="SMV" value={smv} onChange={onSmv} type="number" step="0.01" />
          <TextInput label="Planned operators" value={plannedOperators} onChange={onPlannedOperators} type="number" step="1" />
          <TextInput label="Planned target per day" value={plannedTargetPerDay} onChange={onPlannedTargetPerDay} type="number" step="1" />
        </div>
        <label className="mt-4 block text-sm font-bold text-jade-ink">
          Change reason
          <textarea value={changeReason} onChange={(event) => onChangeReason(event.target.value)} className="mt-2 min-h-24 w-full rounded-md border border-jade-line px-3 py-2 text-sm font-semibold text-jade-ink outline-none focus:border-jade-blue" />
        </label>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="min-h-11 rounded-md border border-jade-line px-4 py-2 text-sm font-black text-jade-ink">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={isSubmitting} className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-jade-blue px-4 py-2 text-sm font-black text-white hover:bg-blue-700 disabled:bg-slate-300">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Confirm assignment
          </button>
        </div>
      </section>
    </div>
  );
}

function getDisabledReason({
  line,
  order,
  roleState,
  isSubmitting,
  profilesTotal,
}: {
  line?: LineCard;
  order?: LineAssignmentOrder;
  roleState: RoleState;
  isSubmitting: boolean;
  profilesTotal: number;
}) {
  if (!line) return "Select an available line.";
  if (line.activeContext) return "Selected line already has an active context.";
  if (!order) return "Select a real order.";
  if (roleState.isLoading) return "Checking assignment access.";
  if (!roleState.hasUser) return "Authentication required.";
  if (profilesTotal === 0) return "No profiles exist yet. First admin setup is required.";
  if (!roleState.canWriteAssignment) return roleState.message || "Planning/Admin role required.";
  if (isSubmitting) return "Creating assignment.";
  return "Ready to create assignment.";
}

function getAssignmentState(line: LineCard, groupByCode: Map<string, ProductionGroup>): AssignmentState {
  if (line.activeContext) return "assigned";
  return isAssignableLine(line, groupByCode) ? "available" : "not_assignable";
}

function isAssignableLine(line: LineCard, groupByCode: Map<string, ProductionGroup>) {
  const group = line.groupCode ? groupByCode.get(line.groupCode) : undefined;
  const isGhostGroup = line.groupCode === "G-11" || group?.is_ghost === true || group?.is_active === false;
  return line.isActive && !line.isSpecial && !isGhostGroup;
}

function getAssignmentLabel(line: LineCard, groupByCode: Map<string, ProductionGroup>) {
  if (line.activeContext && line.status === "WAITING_FOR_DATA") return "Assigned, waiting for execution data";
  if (line.activeContext) return "Already assigned";
  if (!isAssignableLine(line, groupByCode)) return "Not assignable";
  return "Available for assignment";
}

function parseOptionalNumber(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : false;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
      <p className="text-3xl font-black text-jade-ink">{value}</p>
      <p className="mt-2 text-sm font-bold uppercase text-jade-steel">{label}</p>
    </div>
  );
}

function PanelHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-jade-ink">{title}</h2>
        <p className="mt-1 text-sm font-semibold text-jade-steel">{subtitle}</p>
      </div>
      <Link2 className="h-5 w-5 text-jade-blue" aria-hidden="true" />
    </div>
  );
}

function TabButton({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("rounded-md border px-3 py-2 text-left text-sm font-black transition", active ? "border-jade-blue bg-blue-50 text-jade-blue" : "border-slate-200 bg-white text-jade-steel hover:border-jade-blue")}>
      <span>{label}</span>
      <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-jade-ink">{count}</span>
    </button>
  );
}

function AssignmentBadge({ state }: { state: AssignmentState }) {
  const label = state === "available" ? "Available" : state === "assigned" ? "Assigned" : "Not assignable";
  const className = state === "available" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : state === "assigned" ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 bg-slate-100 text-slate-600";
  return <span className={cn("rounded-full border px-2 py-1 text-xs font-black uppercase", className)}>{label}</span>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="text-sm font-bold text-jade-ink">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-md border border-jade-line bg-white px-3 py-2 text-sm text-jade-ink">
        {options.map((option) => <option key={option} value={option}>{option === "ALL" ? `All ${label.toLowerCase()}s` : option.replaceAll("_", " ")}</option>)}
      </select>
    </label>
  );
}

function SearchField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="text-sm font-bold text-jade-ink">
      {label}
      <span className="mt-2 flex items-center gap-2 rounded-md border border-jade-line bg-white px-3 py-2">
        <Search className="h-4 w-4 text-jade-steel" aria-hidden="true" />
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm font-semibold text-jade-ink outline-none" />
      </span>
    </label>
  );
}

function TextInput({ label, value, onChange, type = "text", step }: { label: string; value: string; onChange: (value: string) => void; type?: string; step?: string }) {
  return (
    <label className="text-sm font-bold text-jade-ink">
      {label}
      <input type={type} step={step} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-md border border-jade-line px-3 py-2 text-sm font-semibold text-jade-ink outline-none focus:border-jade-blue" />
    </label>
  );
}

function PreviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
      <h3 className="mb-3 text-xs font-black uppercase text-jade-ink">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-jade-steel">{label}</dt>
      <dd className="text-right font-bold text-jade-ink">{value}</dd>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link2, LockKeyhole, Search } from "lucide-react";
import type {
  LineAssignmentCenterData,
  LineAssignmentOrder,
  LineCard,
} from "@/types/factory";
import { StatusChip } from "@/components/ui/StatusChip";
import { cn } from "@/lib/utils";

export function LineAssignmentCenter({
  data,
}: {
  data: LineAssignmentCenterData;
}) {
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [lineStatusFilter, setLineStatusFilter] = useState("ALL");
  const [lineSearch, setLineSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("ALL");
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const statuses = useMemo(
    () => Array.from(new Set(data.availableLines.map((line) => line.status))).sort(),
    [data.availableLines],
  );
  const customers = useMemo(
    () =>
      Array.from(new Set(data.openOrders.map((order) => order.customerName))).sort(),
    [data.openOrders],
  );
  const selectedLine = data.availableLines.find((line) => line.id === selectedLineId);
  const selectedOrder = data.openOrders.find((order) => order.id === selectedOrderId);

  const filteredLines = data.availableLines.filter((line) => {
    const matchesGroup =
      groupFilter === "ALL" || line.groupCode === groupFilter;
    const matchesStatus =
      lineStatusFilter === "ALL" || line.status === lineStatusFilter;
    const searchable = `${line.lineCode} ${line.groupCode ?? ""} ${line.garmentType}`.toLowerCase();

    return (
      matchesGroup &&
      matchesStatus &&
      searchable.includes(lineSearch.trim().toLowerCase())
    );
  });

  const filteredOrders = data.openOrders.filter((order) => {
    const matchesCustomer =
      customerFilter === "ALL" || order.customerName === customerFilter;
    const searchable = [
      order.orderCode,
      order.poNumber,
      order.customerName,
      order.styleCode,
      order.colorName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      matchesCustomer &&
      searchable.includes(orderSearch.trim().toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Lines waiting" value={data.linesWaitingForContext} />
        <Metric label="Active contexts" value={data.linesWithActiveContext} />
        <Metric label="Open orders" value={data.openOrders.length} />
        <Metric label="Orders with WIP hint" value={data.ordersWithWipReadiness} />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1fr_1fr_420px]">
        <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
          <PanelHeader title="Lines" subtitle="Real production lines only" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-bold text-jade-ink">
              Group
              <select
                value={groupFilter}
                onChange={(event) => setGroupFilter(event.target.value)}
                className="mt-2 w-full rounded-md border border-jade-line bg-white px-3 py-2 text-sm text-jade-ink"
              >
                <option value="ALL">All groups</option>
                {data.groups.map((group) => (
                  <option key={group.id} value={group.group_code}>
                    {group.group_code}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-jade-ink">
              Status
              <select
                value={lineStatusFilter}
                onChange={(event) => setLineStatusFilter(event.target.value)}
                className="mt-2 w-full rounded-md border border-jade-line bg-white px-3 py-2 text-sm text-jade-ink"
              >
                <option value="ALL">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <SearchField
              label="Line search"
              value={lineSearch}
              onChange={setLineSearch}
              placeholder="Line code"
            />
          </div>

          <div className="mt-5 max-h-[620px] space-y-3 overflow-auto pr-1">
            {filteredLines.map((line) => (
              <button
                key={line.id}
                type="button"
                onClick={() => setSelectedLineId(line.id)}
                className={cn(
                  "w-full rounded-md border p-4 text-left transition hover:border-jade-blue",
                  selectedLineId === line.id
                    ? "border-jade-blue bg-blue-50"
                    : "border-slate-100 bg-white",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-jade-ink">{line.lineCode}</p>
                    <p className="mt-1 text-sm font-semibold text-jade-steel">
                      {line.groupCode ?? "No group"} - {line.garmentType}
                    </p>
                  </div>
                  <StatusChip status={line.status} />
                </div>
                <p className="mt-3 text-sm font-semibold text-jade-steel">
                  {line.activeContext
                    ? `Active context: ${line.activeContext.orderCode ?? "assigned"}`
                    : "Waiting for assignment"}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
          <PanelHeader title="Orders" subtitle="Real orders and readiness hints" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold text-jade-ink">
              Customer
              <select
                value={customerFilter}
                onChange={(event) => setCustomerFilter(event.target.value)}
                className="mt-2 w-full rounded-md border border-jade-line bg-white px-3 py-2 text-sm text-jade-ink"
              >
                <option value="ALL">All customers</option>
                {customers.map((customer) => (
                  <option key={customer} value={customer}>
                    {customer}
                  </option>
                ))}
              </select>
            </label>
            <SearchField
              label="Order search"
              value={orderSearch}
              onChange={setOrderSearch}
              placeholder="Order, PO, style, color"
            />
          </div>

          <div className="mt-5 max-h-[620px] space-y-3 overflow-auto pr-1">
            {filteredOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelectedOrderId(order.id)}
                className={cn(
                  "w-full rounded-md border p-4 text-left transition hover:border-jade-blue",
                  selectedOrderId === order.id
                    ? "border-jade-blue bg-blue-50"
                    : "border-slate-100 bg-white",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-black text-jade-ink">
                      {order.orderCode}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-jade-steel">
                      {order.customerName}
                    </p>
                  </div>
                  {order.materialReadinessStatus ? (
                    <StatusChip status={order.materialReadinessStatus} />
                  ) : (
                    <StatusChip status="waiting" />
                  )}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-jade-steel">
                  <Detail label="PO" value={order.poNumber ?? "Waiting"} />
                  <Detail label="Style" value={order.styleCode ?? "Waiting"} />
                  <Detail label="Color" value={order.colorName ?? "Waiting"} />
                  <Detail label="Shipment" value={order.shipmentDate ?? "Waiting"} />
                  <Detail
                    label="Quantity"
                    value={order.orderQuantity === null ? "Waiting" : String(order.orderQuantity)}
                  />
                  <Detail
                    label="WIP"
                    value={
                      order.wipMatchType === "none"
                        ? "Waiting"
                        : order.wipMatchType === "order"
                          ? "Order linked"
                          : "Needs confirmation"
                    }
                  />
                </dl>
              </button>
            ))}
          </div>
        </section>

        <AssignmentPreview
          line={selectedLine}
          order={selectedOrder}
          auth={data.auth}
          globalWarnings={data.warnings}
        />
      </div>
    </div>
  );
}

function AssignmentPreview({
  line,
  order,
  auth,
  globalWarnings,
}: {
  line?: LineCard;
  order?: LineAssignmentOrder;
  auth: LineAssignmentCenterData["auth"];
  globalWarnings: string[];
}) {
  const warnings = [
    ...globalWarnings,
    ...(line?.activeContext ? ["Line already has active context."] : []),
    ...(order?.warnings ?? []),
    "WIP is not line-specific yet.",
    auth.message,
  ];

  return (
    <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
      <PanelHeader title="Assignment preview" subtitle="No write is performed here" />

      <div className="mt-5 space-y-4">
        <PreviewBlock title="Selected line">
          {line ? (
            <>
              <Detail label="Line" value={line.lineCode} />
              <Detail label="Group" value={line.groupCode ?? "No group"} />
              <Detail label="Status" value={line.status.replaceAll("_", " ")} />
              <Detail
                label="Context"
                value={line.activeContext ? "Active context exists" : "Waiting for assignment"}
              />
            </>
          ) : (
            <p className="text-sm font-semibold text-jade-steel">Select a real line.</p>
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
              <Detail
                label="Material"
                value={order.materialReadinessStatus ?? "Waiting"}
              />
              <Detail label="WIP" value={order.wipReadinessHint ?? "Waiting"} />
            </>
          ) : (
            <p className="text-sm font-semibold text-jade-steel">Select a real order.</p>
          )}
        </PreviewBlock>

        <PreviewBlock title="Warnings">
          <ul className="space-y-2 text-sm font-semibold text-jade-steel">
            {Array.from(new Set(warnings)).map((warning) => (
              <li key={warning} className="rounded-md bg-orange-50 px-3 py-2 text-orange-900">
                {warning}
              </li>
            ))}
          </ul>
        </PreviewBlock>

        <button
          type="button"
          disabled
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-slate-200 px-4 py-3 text-sm font-black text-slate-600"
        >
          <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          Create assignment
        </button>
        <p className="text-sm leading-6 text-jade-steel">{auth.message}</p>
      </div>
    </section>
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

function SearchField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="text-sm font-bold text-jade-ink">
      {label}
      <span className="mt-2 flex items-center gap-2 rounded-md border border-jade-line bg-white px-3 py-2">
        <Search className="h-4 w-4 text-jade-steel" aria-hidden="true" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm font-semibold text-jade-ink outline-none"
        />
      </span>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
      <p className="text-3xl font-black text-jade-ink">{value}</p>
      <p className="mt-2 text-sm font-bold uppercase text-jade-steel">{label}</p>
    </div>
  );
}

function PreviewBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
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

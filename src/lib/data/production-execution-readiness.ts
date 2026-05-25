"use client";

import {
  getSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import type { FactoryDataResult } from "@/types/factory";
import type { LineStatus } from "@/types/database";

type AssignmentStatusCode = "AVAILABLE" | "ASSIGNED" | "NOT_ASSIGNABLE";

type ExecutionReadinessStatus =
  | "NOT_STARTED"
  | "WAITING_FOR_EXECUTION_DATA"
  | "READY_TO_START"
  | "RUNNING"
  | "PAUSED_STOPPED"
  | "QUALITY_HOLD"
  | "NO_FEEDING"
  | "COMPLETED_OR_CLOSED";

export interface ProductionExecutionReadinessLine {
  id: string;
  lineCode: string;
  groupCode: string | null;
  groupName: string | null;
  garmentType: string;
  status: LineStatus;
  assignmentStatus: AssignmentStatusCode;
  executionReadinessStatus: ExecutionReadinessStatus;
  executionReadinessBlockers: string[];
  feedPercent: number | null;
  feedCoverDays: number | null;
  actualToday: number | null;
  targetToday: number | null;
  lastRefreshedAt: string | null;
  activeContext: {
    id: string;
    orderId: string | null;
    orderCode: string | null;
    customerId: string | null;
    customerName: string | null;
    styleCode: string | null;
    colorName: string | null;
    shipmentDate: string | null;
  } | null;
}

export interface ProductionExecutionReadinessData {
  summary: {
    totalLines: number;
    assignedLines: number;
    readyToStartLines: number;
    runningSessions: number;
    blockedLines: number;
  };
  schemaStatus: {
    readinessViewAvailable: boolean;
    sessionsTableAvailable: boolean;
    eventsTableAvailable: boolean;
    sessionsCount: number;
    eventsCount: number;
  };
  allLines: ProductionExecutionReadinessLine[];
  readyLines: ProductionExecutionReadinessLine[];
  blockedLines: ProductionExecutionReadinessLine[];
  warnings: string[];
}

function notConfigured<T>(): FactoryDataResult<T> {
  return {
    status: "not_configured",
    message: "Supabase connection required.",
  };
}

function errorResult<T>(message: string, cause?: string): FactoryDataResult<T> {
  return {
    status: "error",
    message,
    cause,
  };
}

function success<T>(data: T): FactoryDataResult<T> {
  return {
    status: "success",
    data,
  };
}

function ensureClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  return getSupabaseClient();
}

export async function getProductionExecutionReadinessData(): Promise<
  FactoryDataResult<ProductionExecutionReadinessData>
> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  const [
    readinessResult,
    sessionsStatus,
    eventsTableAvailable,
    eventsCount,
  ] = await Promise.all([
    client
      .from("production_execution_readiness_view")
      .select(
        [
          "line_id",
          "line_code",
          "group_code",
          "group_name",
          "current_context_id",
          "context_id",
          "order_id",
          "order_code",
          "customer_id",
          "customer_name",
          "style_code",
          "color_name",
          "shipment_date",
          "line_status",
          "assignment_status",
          "execution_readiness_status",
          "readiness_blockers",
          "feed_percent",
          "feed_cover_days",
          "actual_today",
          "target_today",
          "last_refreshed_at",
        ].join(","),
      )
      .order("group_code", { ascending: true })
      .order("line_code", { ascending: true }),
    getActiveProductionExecutionSessionsSafe(),
    hasReadableTableSafe("production_execution_events"),
    getTableCountSafe("production_execution_events"),
  ]);

  if (readinessResult.error) {
    return errorResult(
      "Production execution readiness view is not available or not readable.",
      readinessResult.error.message,
    );
  }

  const allLines = ((readinessResult.data ?? []) as unknown as Record<
    string,
    unknown
  >[]).map(productionExecutionLineFromReadinessRow);
  const readyLines = allLines.filter(
    (line) => line.executionReadinessStatus === "READY_TO_START",
  );
  const blockedLines = allLines.filter(
    (line) => line.executionReadinessBlockers.length > 0,
  );
  const runningLinesFromView = allLines.filter(
    (line) => line.executionReadinessStatus === "RUNNING",
  ).length;

  return success({
    summary: {
      totalLines: allLines.length,
      assignedLines: allLines.filter((line) => line.assignmentStatus === "ASSIGNED")
        .length,
      readyToStartLines: readyLines.length,
      runningSessions: sessionsStatus.tableAvailable
        ? sessionsStatus.runningSessions
        : runningLinesFromView,
      blockedLines: blockedLines.length,
    },
    schemaStatus: {
      readinessViewAvailable: true,
      sessionsTableAvailable: sessionsStatus.tableAvailable,
      eventsTableAvailable,
      sessionsCount: sessionsStatus.runningSessions,
      eventsCount,
    },
    allLines,
    readyLines,
    blockedLines,
    warnings: [
      "Production execution readiness is loaded from production_execution_readiness_view.",
      "READY_TO_START is readiness only; it does not mean RUNNING.",
      "Production start is disabled in this phase.",
      "No line can be marked RUNNING from this screen yet.",
      "Start Production remains disabled until the controlled RPC test phase.",
      "Backend-only RPC test plan is prepared; frontend Start Production remains disabled.",
    ],
  });
}

async function getActiveProductionExecutionSessionsSafe() {
  const client = ensureClient();

  if (!client) {
    return {
      tableAvailable: false,
      runningSessions: 0,
    };
  }

  const { data, error } = await client
    .from("production_execution_sessions")
    .select("id, status, ended_at")
    .is("ended_at", null);

  if (error) {
    return {
      tableAvailable: false,
      runningSessions: 0,
    };
  }

  const rows = (data ?? []) as Array<{ status?: string | null }>;

  return {
    tableAvailable: true,
    runningSessions: rows.filter((row) => row.status !== "CLOSED").length,
  };
}

async function hasReadableTableSafe(tableName: string) {
  const client = ensureClient();

  if (!client) {
    return false;
  }

  const { error } = await client.from(tableName).select("id", { head: true }).limit(1);
  return !error;
}

async function getTableCountSafe(tableName: string) {
  const client = ensureClient();

  if (!client) {
    return 0;
  }

  const { count, error } = await client
    .from(tableName)
    .select("id", { count: "exact", head: true });

  if (error) {
    return 0;
  }

  return count ?? 0;
}

function productionExecutionLineFromReadinessRow(
  row: Record<string, unknown>,
): ProductionExecutionReadinessLine {
  const lineCode = asString(row.line_code) ?? "Unknown line";
  const prefix = lineCode.replace(/[0-9]/g, "");
  const contextId = asString(row.context_id);

  return {
    id: asString(row.line_id) ?? "",
    lineCode,
    groupCode: asString(row.group_code),
    groupName: asString(row.group_name),
    garmentType: getGarmentType(prefix),
    status: normalizeLineStatus(row.line_status),
    assignmentStatus: normalizeAssignmentStatus(row.assignment_status),
    executionReadinessStatus: normalizeExecutionReadinessStatus(
      row.execution_readiness_status,
    ),
    executionReadinessBlockers: asStringArray(row.readiness_blockers),
    feedPercent: asNumber(row.feed_percent),
    feedCoverDays: asNumber(row.feed_cover_days),
    actualToday: asNumber(row.actual_today),
    targetToday: asNumber(row.target_today),
    lastRefreshedAt: asString(row.last_refreshed_at),
    activeContext:
      contextId === null
        ? null
        : {
            id: contextId,
            orderId: asString(row.order_id),
            orderCode: asString(row.order_code),
            customerId: asString(row.customer_id),
            customerName: asString(row.customer_name),
            styleCode: asString(row.style_code),
            colorName: asString(row.color_name),
            shipmentDate: asString(row.shipment_date),
          },
  };
}

function normalizeLineStatus(value: unknown): LineStatus {
  const status = asString(value);
  const allowed: LineStatus[] = [
    "WAITING_FOR_DATA",
    "RUNNING",
    "STOPPED",
    "CHANGEOVER",
    "QUALITY_HOLD",
    "NO_FEEDING",
    "INACTIVE",
  ];

  return allowed.find((item) => item === status) ?? "WAITING_FOR_DATA";
}

function normalizeAssignmentStatus(value: unknown): AssignmentStatusCode {
  const status = asString(value);

  if (
    status === "AVAILABLE" ||
    status === "ASSIGNED" ||
    status === "NOT_ASSIGNABLE"
  ) {
    return status;
  }

  return "NOT_ASSIGNABLE";
}

function normalizeExecutionReadinessStatus(value: unknown): ExecutionReadinessStatus {
  const status = asString(value);

  if (
    status === "NOT_STARTED" ||
    status === "WAITING_FOR_EXECUTION_DATA" ||
    status === "READY_TO_START" ||
    status === "RUNNING" ||
    status === "PAUSED_STOPPED" ||
    status === "QUALITY_HOLD" ||
    status === "NO_FEEDING" ||
    status === "COMPLETED_OR_CLOSED"
  ) {
    return status;
  }

  return "WAITING_FOR_EXECUTION_DATA";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asString(item))
    .filter((item): item is string => item !== null);
}

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function getGarmentType(prefix: string) {
  if (prefix === "T") {
    return "t-shirt";
  }

  if (prefix === "H") {
    return "hoodie";
  }

  if (prefix === "SW") {
    return "sweatshirt";
  }

  if (prefix === "P") {
    return "pants";
  }

  if (prefix === "SH") {
    return "shorts";
  }

  return "garment";
}

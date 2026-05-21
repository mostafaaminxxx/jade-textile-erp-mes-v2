import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  LineCurrentState,
  LineStatus,
  ProductionGroup,
  ReadinessStatus,
} from "@/types/database";
import type {
  ExecutiveSummary,
  FactoryDataResult,
  ImportBatchSummary,
  LineCard,
  OrdersSummary,
  ProductionLineWithGroup,
  ReadinessSummary,
} from "@/types/factory";

const CONNECTION_REQUIRED = "Supabase connection required.";
const WAITING_FOR_REAL_DATA = "Waiting for real factory data.";

function notConfigured<T>(): FactoryDataResult<T> {
  return {
    status: "not_configured",
    message: CONNECTION_REQUIRED,
  };
}

function empty<T>(): FactoryDataResult<T> {
  return {
    status: "empty",
    message: WAITING_FOR_REAL_DATA,
  };
}

function errorResult<T>(message: string, cause?: string): FactoryDataResult<T> {
  return {
    status: "error",
    message,
    cause,
  };
}

function ensureClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  return getSupabaseClient();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function getCount(tableName: string): Promise<number> {
  const client = ensureClient();

  if (!client) {
    return 0;
  }

  const { count, error } = await client
    .from(tableName)
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getFactoryGroups(): Promise<
  FactoryDataResult<ProductionGroup[]>
> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  const { data, error } = await client
    .from("production_groups")
    .select("id, group_code, group_name, display_order, is_active, is_ghost")
    .order("display_order", { ascending: true });

  if (error) {
    return errorResult("Unable to load factory groups.", error.message);
  }

  if (!data || data.length === 0) {
    return empty();
  }

  return { status: "success", data: data as ProductionGroup[] };
}

export async function getProductionLines(): Promise<
  FactoryDataResult<ProductionLineWithGroup[]>
> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  const { data, error } = await client
    .from("production_lines")
    .select(
      "id, line_code, group_id, line_prefix, line_number, is_active, is_special, production_groups(group_code)",
    )
    .order("line_code", { ascending: true });

  if (error) {
    return errorResult("Unable to load production lines.", error.message);
  }

  if (!data || data.length === 0) {
    return empty();
  }

  return { status: "success", data: data as unknown as ProductionLineWithGroup[] };
}

export async function getLineCards(): Promise<FactoryDataResult<LineCard[]>> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  const { data: lines, error: lineError } = await client
    .from("production_lines")
    .select(
      "id, line_code, group_id, line_prefix, line_number, is_active, is_special, production_groups(group_code)",
    )
    .order("line_code", { ascending: true });

  if (lineError) {
    return errorResult("Unable to load line cards.", lineError.message);
  }

  if (!lines || lines.length === 0) {
    return empty();
  }

  const { data: states, error: stateError } = await client
    .from("line_current_state")
    .select(
      "line_id, current_context_id, line_status, stop_reason, feed_percent, feed_cover_days, actual_today, target_today, required_operators, actual_operators, quality_hold, shipment_risk, last_event_at, last_refreshed_at",
    );

  if (stateError) {
    return errorResult("Unable to load current line states.", stateError.message);
  }

  const statesByLine = new Map(
    ((states ?? []) as LineCurrentState[]).map((state) => [state.line_id, state]),
  );

  const data = (lines as unknown as ProductionLineWithGroup[]).map((line) => {
    const state = statesByLine.get(line.id);
    const prefix = line.line_prefix ?? getLinePrefix(line.line_code);
    const group = getSingleRelationship(line.production_groups);

    return {
      id: line.id,
      lineCode: line.line_code,
      linePrefix: prefix,
      lineNumber: line.line_number,
      groupId: line.group_id,
      groupCode: group?.group_code ?? null,
      status: state?.line_status ?? "WAITING_FOR_DATA",
      stopReason: state?.stop_reason ?? null,
      feedPercent: state?.feed_percent ?? null,
      isActive: line.is_active,
      garmentType: getGarmentType(prefix),
    } satisfies LineCard;
  });

  return { status: "success", data };
}

export async function getOrdersSummary(): Promise<
  FactoryDataResult<OrdersSummary>
> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  try {
    const [totalOrders, productionPlans, routeCount, dailyQuantityRows] =
      await Promise.all([
        getCount("orders"),
        getCount("production_plans"),
        getCount("order_operation_routes"),
        getCount("production_plan_daily_quantities"),
      ]);

    if (totalOrders === 0) {
      return empty();
    }

    const { data: ordersByCustomer, error: customerError } = await client
      .from("orders")
      .select("customer_id, customers(customer_name)")
      .limit(2000);

    if (customerError) {
      return errorResult("Unable to summarize orders by customer.", customerError.message);
    }

    const byCustomerMap = new Map<string, number>();
    for (const row of (ordersByCustomer ?? []) as unknown as Array<{
      customers: { customer_name: string } | { customer_name: string }[] | null;
    }>) {
      const customer = getSingleRelationship(row.customers);
      const name = customer?.customer_name ?? "Unassigned customer";
      byCustomerMap.set(name, (byCustomerMap.get(name) ?? 0) + 1);
    }

    const { data: shipmentRows, error: shipmentError } = await client
      .from("orders")
      .select("order_code, shipment_date, customers(customer_name)")
      .not("shipment_date", "is", null)
      .order("shipment_date", { ascending: true })
      .limit(8);

    if (shipmentError) {
      return errorResult(
        "Unable to load nearest shipment dates.",
        shipmentError.message,
      );
    }

    return {
      status: "success",
      data: {
        totalOrders,
        productionPlans,
        routeCount,
        dailyQuantityRows,
        byCustomer: Array.from(byCustomerMap.entries())
          .map(([customerName, count]) => ({ customerName, count }))
          .sort((a, b) => b.count - a.count),
        nearestShipmentDates: ((shipmentRows ?? []) as unknown as Array<{
          order_code: string | null;
          shipment_date: string | null;
          customers: { customer_name: string } | { customer_name: string }[] | null;
        }>).map((row) => ({
          orderCode: row.order_code ?? "Uncoded order",
          customerName:
            getSingleRelationship(row.customers)?.customer_name ??
            "Unassigned customer",
          shipmentDate: row.shipment_date ?? "",
        })),
      },
    };
  } catch (error) {
    return errorResult("Unable to load orders summary.", getErrorMessage(error));
  }
}

export async function getMaterialReadinessSummary(): Promise<
  FactoryDataResult<ReadinessSummary>
> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  try {
    const [totalRows, fabricStockRows] = await Promise.all([
      getCount("material_readiness"),
      getCount("fabric_stock_items"),
    ]);

    if (totalRows === 0) {
      return empty();
    }

    const { data, error } = await client
      .from("material_readiness")
      .select("readiness_status")
      .limit(5000);

    if (error) {
      return errorResult("Unable to summarize material readiness.", error.message);
    }

    return {
      status: "success",
      data: {
        totalRows,
        fabricStockRows,
        distribution: summarizeReadiness(
          ((data ?? []) as Array<{ readiness_status: ReadinessStatus }>).map(
            (row) => row.readiness_status,
          ),
        ),
      },
    };
  } catch (error) {
    return errorResult(
      "Unable to load material readiness summary.",
      getErrorMessage(error),
    );
  }
}

export async function getWipReadinessSummary(): Promise<
  FactoryDataResult<ReadinessSummary>
> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  try {
    const [totalRows, cutPanelRows] = await Promise.all([
      getCount("wip_readiness"),
      getCount("cut_panel_wip"),
    ]);

    if (totalRows === 0) {
      return empty();
    }

    const { data, error } = await client
      .from("wip_readiness")
      .select("readiness_status")
      .limit(5000);

    if (error) {
      return errorResult("Unable to summarize WIP readiness.", error.message);
    }

    return {
      status: "success",
      data: {
        totalRows,
        cutPanelRows,
        distribution: summarizeReadiness(
          ((data ?? []) as Array<{ readiness_status: ReadinessStatus }>).map(
            (row) => row.readiness_status,
          ),
        ),
      },
    };
  } catch (error) {
    return errorResult("Unable to load WIP readiness summary.", getErrorMessage(error));
  }
}

export async function getImportBatchSummary(): Promise<
  FactoryDataResult<ImportBatchSummary>
> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  const { data, error, count } = await client
    .from("import_batches")
    .select(
      "id, target_domain, import_name, import_status, total_rows, valid_rows, conflict_rows, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return errorResult("Unable to load import batches.", error.message);
  }

  if (!data || data.length === 0) {
    return empty();
  }

  const batches = data as ImportBatchSummary["batches"];

  return {
    status: "success",
    data: {
      totalBatches: count ?? batches.length,
      requiringReview: batches.filter((batch) =>
        ["CONFLICTS_FOUND", "PENDING_APPROVAL", "FAILED"].includes(
          batch.import_status,
        ),
      ).length,
      batches,
    },
  };
}

export async function getExecutiveSummary(): Promise<
  FactoryDataResult<ExecutiveSummary>
> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  try {
    const [
      activeGroups,
      productionLines,
      orders,
      materialReadinessRows,
      wipReadinessRows,
      imports,
    ] = await Promise.all([
      getActiveGroupCount(),
      getCount("production_lines"),
      getCount("orders"),
      getCount("material_readiness"),
      getCount("wip_readiness"),
      getImportBatchSummary(),
    ]);

    return {
      status: "success",
      data: {
        activeGroups,
        productionLines,
        orders,
        materialReadinessRows,
        wipReadinessRows,
        importBatchesRequiringReview:
          imports.status === "success" ? imports.data.requiringReview : 0,
      },
    };
  } catch (error) {
    return errorResult("Unable to load executive summary.", getErrorMessage(error));
  }
}

async function getActiveGroupCount() {
  const client = ensureClient();

  if (!client) {
    return 0;
  }

  const { count, error } = await client
    .from("production_groups")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

function summarizeReadiness(statuses: ReadinessStatus[]) {
  const counts = new Map<ReadinessStatus, number>();

  for (const status of statuses) {
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

function getSingleRelationship<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getLinePrefix(lineCode: string) {
  return lineCode.replace(/[0-9]/g, "");
}

export function getGarmentType(prefix: string) {
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

export function getLineVisualPriority(
  status: LineStatus,
  feedPercent: number | null,
  stopReason: string | null,
) {
  if (status === "CHANGEOVER") {
    return "changeover";
  }

  if ((feedPercent !== null && feedPercent <= 1) || stopReason === "FEEDING") {
    return "no_feeding";
  }

  if (status === "STOPPED") {
    return "stopped";
  }

  if (status === "RUNNING") {
    return "running";
  }

  return "waiting";
}

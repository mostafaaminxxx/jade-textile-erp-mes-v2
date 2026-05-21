import {
  getSupabaseClient,
  getSupabasePublicConfig,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import type {
  ImportDomain,
  ImportStatus,
  LineCurrentState,
  LineStatus,
  ProductionGroup,
} from "@/types/database";
import type {
  ActiveLineContext,
  AuthProfileReadinessData,
  DatabaseReadinessChecklist,
  ExecutiveCommandCenterData,
  ExecutiveSummary,
  FactoryDataResult,
  FactoryMapData,
  GroupDetailData,
  GroupWithLines,
  ImportBatchSummary,
  LabelCount,
  LineAssignmentCenterData,
  LineAssignmentOrder,
  LineCard,
  LineDetailData,
  MaterialWipReadinessData,
  OrdersPlanningData,
  ProductionLineWithGroup,
  ReadinessSummary,
  ReportsImportsData,
  StatusCount,
} from "@/types/factory";

const CONNECTION_REQUIRED = "Supabase connection required.";
const WAITING_FOR_REAL_DATA = "Waiting for real factory data.";
const GROUP_ORDER = Array.from({ length: 15 }, (_, index) => `G-${index + 1}`);
const WEEK_RANGE = new Set(["21", "22", "23", "24", "25"]);

function notConfigured<T>(): FactoryDataResult<T> {
  return {
    status: "not_configured",
    message: CONNECTION_REQUIRED,
  };
}

function empty<T>(message = WAITING_FOR_REAL_DATA): FactoryDataResult<T> {
  return {
    status: "empty",
    message,
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

async function getCountSafe(tableName: string): Promise<number> {
  try {
    return await getCount(tableName);
  } catch {
    return 0;
  }
}

async function getFilteredCountSafe(
  tableName: string,
  column: string,
  value: string | number | boolean,
): Promise<number> {
  const client = ensureClient();

  if (!client) {
    return 0;
  }

  const { count, error } = await client
    .from(tableName)
    .select("*", { count: "exact", head: true })
    .eq(column, value);

  if (error) {
    return 0;
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

  return success(data as ProductionGroup[]);
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
      "id, line_code, group_id, line_prefix, line_number, is_active, is_special, production_groups(group_code, group_name)",
    )
    .order("line_code", { ascending: true });

  if (error) {
    return errorResult("Unable to load production lines.", error.message);
  }

  if (!data || data.length === 0) {
    return empty();
  }

  return success(data as unknown as ProductionLineWithGroup[]);
}

export async function getLineCards(): Promise<FactoryDataResult<LineCard[]>> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  try {
    const viewLines = await getLineCardsFromView();

    if (viewLines.status === "success") {
      return viewLines;
    }

    return getLineCardsFromBaseTables();
  } catch (error) {
    return errorResult("Unable to load line cards.", getErrorMessage(error));
  }
}

export async function getFactoryMapData(): Promise<
  FactoryDataResult<FactoryMapData>
> {
  const [groupsResult, linesResult] = await Promise.all([
    getFactoryGroups(),
    getLineCards(),
  ]);

  if (groupsResult.status !== "success") {
    return groupsResult as FactoryDataResult<FactoryMapData>;
  }

  if (linesResult.status !== "success") {
    return linesResult as FactoryDataResult<FactoryMapData>;
  }

  const groupZones = buildGroupZones(groupsResult.data, linesResult.data);
  const waitingLineCount = linesResult.data.filter(
    (line) => line.status === "WAITING_FOR_DATA",
  ).length;
  const activeContextCount = linesResult.data.filter(
    (line) => line.activeContext !== null,
  ).length;

  return success({
    groups: groupsResult.data,
    lines: linesResult.data,
    groupZones,
    summary: {
      groupCount: groupsResult.data.length,
      lineCount: linesResult.data.length,
      waitingLineCount,
      activeContextCount,
    },
  });
}

export async function getGroupDetailData(
  groupCode: string,
): Promise<FactoryDataResult<GroupDetailData>> {
  const mapResult = await getFactoryMapData();

  if (mapResult.status !== "success") {
    return mapResult as FactoryDataResult<GroupDetailData>;
  }

  const group = mapResult.data.groupZones.find(
    (item) => item.group_code === groupCode,
  );

  if (!group) {
    return empty(`Group ${groupCode} is not available in the real factory map.`);
  }

  return success({
    group,
    lines: group.lines,
    statusDistribution: summarizeStatuses(group.lines.map((line) => line.status)),
    waitingLineCount: group.waitingLines,
    activeContextLineCount: group.activeContextLines,
  });
}

export async function getLineDetailData(
  lineCode: string,
): Promise<FactoryDataResult<LineDetailData>> {
  const lines = await getLineCards();

  if (lines.status !== "success") {
    return lines as FactoryDataResult<LineDetailData>;
  }

  const line = lines.data.find((item) => item.lineCode === lineCode);

  if (!line) {
    return empty(`Line ${lineCode} is not available in production_lines.`);
  }

  return success({
    line,
    currentState: lineToCurrentState(line),
  });
}

export async function getExecutiveCommandCenterData(): Promise<
  FactoryDataResult<ExecutiveCommandCenterData>
> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  try {
    const [
      groups,
      activeGroups,
      ghostGroups,
      productionLines,
      orders,
      productionPlans,
      orderOperationRoutes,
      weeklyPlanRows,
      materialReadinessRows,
      fabricStockRows,
      cutPanelWipRows,
      wipReadinessRows,
      lineCurrentStateRows,
      waitingForDataLines,
      lineOrderContexts,
      activeLineOrderContexts,
      importBatches,
      pendingApproval,
      applied,
      conflicts,
    ] = await Promise.all([
      getCount("production_groups"),
      getFilteredCountSafe("production_groups", "is_active", true),
      getFilteredCountSafe("production_groups", "is_ghost", true),
      getCount("production_lines"),
      getCount("orders"),
      getCount("production_plans"),
      getCount("order_operation_routes"),
      getCount("production_plan_daily_quantities"),
      getCount("material_readiness"),
      getCount("fabric_stock_items"),
      getCount("cut_panel_wip"),
      getCount("wip_readiness"),
      getCount("line_current_state"),
      getFilteredCountSafe("line_current_state", "line_status", "WAITING_FOR_DATA"),
      getCount("line_order_contexts"),
      getFilteredCountSafe("line_order_contexts", "is_active", true),
      getCountSafe("import_batches"),
      getFilteredCountSafe("import_batches", "import_status", "PENDING_APPROVAL"),
      getFilteredCountSafe("import_batches", "import_status", "APPLIED"),
      getFilteredCountSafe("import_batches", "import_status", "CONFLICTS_FOUND"),
    ]);

    return success({
      factoryStructure: {
        groups,
        activeGroups,
        ghostGroups,
        productionLines,
      },
      planning: {
        orders,
        productionPlans,
        orderOperationRoutes,
        weeklyPlanRows,
      },
      materialWip: {
        materialReadinessRows,
        fabricStockRows,
        cutPanelWipRows,
        wipReadinessRows,
      },
      lineExecution: {
        lineCurrentStateRows,
        waitingForDataLines,
        lineOrderContexts,
        activeLineOrderContexts,
      },
      imports: {
        importBatches,
        pendingApproval,
        applied,
        conflicts,
      },
      foundationStatus: [
        statusItem("Factory structure loaded", groups > 0 && productionLines > 0),
        statusItem("Orders/planning loaded", orders > 0 && productionPlans > 0),
        statusItem("Material readiness loaded", materialReadinessRows > 0),
        statusItem("WIP readiness loaded", wipReadinessRows > 0),
        {
          label: "Line assignments waiting for real line-order context",
          state: lineOrderContexts === 0 ? "waiting" : "loaded",
          detail:
            lineOrderContexts === 0
              ? "line_order_contexts is empty, so lines have no active order assignment yet."
              : `${lineOrderContexts} line-order context rows are available.`,
        },
        {
          label: "Downtime module not activated yet",
          state: "inactive",
          detail: "No downtime workflow is enabled in this phase.",
        },
        {
          label: "Production execution module not activated yet",
          state: "inactive",
          detail: "No production entry workflow is enabled in this phase.",
        },
      ],
    });
  } catch (error) {
    return errorResult(
      "Unable to load executive command center data.",
      getErrorMessage(error),
    );
  }
}

export async function getOrdersPlanningData(): Promise<
  FactoryDataResult<OrdersPlanningData>
> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  try {
    const [
      totalOrders,
      productionPlans,
      routeCount,
      dailyQuantityRows,
      contexts,
      activeContexts,
      waitingLines,
    ] = await Promise.all([
      getCount("orders"),
      getCount("production_plans"),
      getCount("order_operation_routes"),
      getCount("production_plan_daily_quantities"),
      getCount("line_order_contexts"),
      getFilteredCountSafe("line_order_contexts", "is_active", true),
      getFilteredCountSafe("line_current_state", "line_status", "WAITING_FOR_DATA"),
    ]);

    if (totalOrders === 0) {
      return empty();
    }

    const byCustomer = await getOrdersByCustomer();
    const nearestShipmentDates = await getNearestShipmentDates();
    const weekQuantitySummary = await getWeekQuantitySummary();

    return success({
      totalOrders,
      productionPlans,
      routeCount,
      dailyQuantityRows,
      lineOrderContexts: contexts,
      activeLineOrderContexts: activeContexts,
      waitingLines,
      byCustomer,
      nearestShipmentDates,
      weekQuantitySummary,
    });
  } catch (error) {
    return errorResult("Unable to load orders planning data.", getErrorMessage(error));
  }
}

export async function getLineAssignmentCenterData(): Promise<
  FactoryDataResult<LineAssignmentCenterData>
> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  try {
    const [
      groupsResult,
      linesResult,
      orders,
      materialRows,
      wipRows,
      auth,
      profileReadiness,
    ] =
      await Promise.all([
        getFactoryGroups(),
        getLineCards(),
        getAssignmentOrders(),
        getAssignmentRows("material_readiness"),
        getAssignmentRows("wip_readiness"),
        getAssignmentAuthState(),
        getProfileReadinessCounts(),
      ]);

    if (groupsResult.status !== "success") {
      return groupsResult as FactoryDataResult<LineAssignmentCenterData>;
    }

    if (linesResult.status !== "success") {
      return linesResult as FactoryDataResult<LineAssignmentCenterData>;
    }

    if (orders.length === 0) {
      return empty();
    }

    const materialByOrder = groupRowsByKey(materialRows, "order_id");
    const wipByOrder = groupRowsByKey(wipRows, "order_id");
    const wipByCustomer = groupRowsByKey(wipRows, "customer_id");
    const openOrders = orders
      .filter(isOpenOrderRow)
      .map((order) =>
        assignmentOrderFromRow(
          order,
          materialByOrder.get(asString(order.id) ?? "") ?? [],
          wipByOrder.get(asString(order.id) ?? "") ?? [],
          wipByCustomer.get(asString(order.customer_id) ?? "") ?? [],
        ),
      );
    const currentActiveLineContexts = linesResult.data.flatMap((line) =>
      line.activeContext ? [line.activeContext] : [],
    );
    const linesWithActiveContext = currentActiveLineContexts.length;
    const warnings = [
      "No automatic assignments are created.",
      "Assignment writes require authentication and Planning/Admin role.",
    ];

    if (linesWithActiveContext === 0) {
      warnings.push("line_order_contexts is empty; all lines are waiting for real assignment.");
    }

    if (profileReadiness.profilesTotal === 0) {
      warnings.push("No profiles exist yet. First admin setup is required.");
    }

    return success({
      groups: groupsResult.data,
      availableLines: linesResult.data,
      linesWithActiveContext,
      linesWaitingForContext: linesResult.data.length - linesWithActiveContext,
      openOrders,
      ordersWithMaterialReadiness: openOrders.filter(
        (order) => order.materialReadinessStatus !== null,
      ).length,
      ordersWithWipReadiness: openOrders.filter(
        (order) => order.wipMatchType !== "none",
      ).length,
      currentActiveLineContexts,
      warnings,
      auth,
      profileReadiness,
    });
  } catch (error) {
    return errorResult(
      "Unable to load line assignment center data.",
      getErrorMessage(error),
    );
  }
}

export async function getAuthProfileReadinessData(): Promise<
  FactoryDataResult<AuthProfileReadinessData>
> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  try {
    return success(await getProfileReadinessCounts());
  } catch (error) {
    return errorResult(
      "Unable to load auth profile readiness.",
      getErrorMessage(error),
    );
  }
}

export async function getMaterialWipReadinessData(): Promise<
  FactoryDataResult<MaterialWipReadinessData>
> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  try {
    const [materialRows, fabricStockRows, wipRows, cutPanelRows] =
      await Promise.all([
        getCount("material_readiness"),
        getCount("fabric_stock_items"),
        getCount("wip_readiness"),
        getCount("cut_panel_wip"),
      ]);

    if (materialRows === 0 && wipRows === 0) {
      return empty();
    }

    const [
      materialDistribution,
      fabricStatusSummary,
      accessoryStatusSummary,
      wipDistribution,
      feedCoverSummary,
    ] = await Promise.all([
      getStatusDistribution("material_readiness", "readiness_status"),
      getStatusDistribution("material_readiness", "fabric_status"),
      getStatusDistribution("material_readiness", "accessory_status"),
      getStatusDistribution("wip_readiness", "readiness_status"),
      getWipFeedCoverSummary(),
    ]);

    return success({
      material: {
        totalRows: materialRows,
        readinessDistribution: materialDistribution,
        fabricStatusSummary,
        accessoryStatusSummary,
        fabricStockRows,
      },
      wip: {
        totalRows: wipRows,
        readinessDistribution: wipDistribution,
        cutPanelRows,
        feedCoverSummary,
      },
    });
  } catch (error) {
    return errorResult(
      "Unable to load material and WIP readiness data.",
      getErrorMessage(error),
    );
  }
}

export async function getReportsImportsData(): Promise<
  FactoryDataResult<ReportsImportsData>
> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  const sourceFiles = await getCountSafe("source_files");
  const batches = await getImportBatches();

  if (batches.status !== "success") {
    return batches as FactoryDataResult<ReportsImportsData>;
  }

  const data = batches.data;

  return success({
    sourceFiles,
    totalBatches: data.totalBatches,
    pendingApproval: data.pendingApproval,
    applied: data.applied,
    conflicts: data.conflicts,
    batches: data.batches,
  });
}

export async function getDatabaseReadinessChecklist(): Promise<
  FactoryDataResult<DatabaseReadinessChecklist>
> {
  const config = getSupabasePublicConfig();

  if (!config.isConfigured) {
    return notConfigured();
  }

  try {
    const [
      customers,
      styles,
      groups,
      lines,
      orders,
      materialReadiness,
      wipReadiness,
      lineContexts,
      profiles,
    ] = await Promise.all([
      getCount("customers"),
      getCount("style_master"),
      getCount("production_groups"),
      getCount("production_lines"),
      getCount("orders"),
      getCount("material_readiness"),
      getCount("wip_readiness"),
      getCount("line_order_contexts"),
      getCountSafe("profiles"),
    ]);

    return success({
      supabaseConfigured: config.isConfigured,
      projectUrl: config.url,
      env: {
        hasUrl: config.hasUrl,
        hasAnonKey: config.hasAnonKey,
        exposesServiceRole: false,
      },
      items: [
        checklistItem("customers loaded", customers),
        checklistItem("styles loaded", styles),
        checklistItem("groups loaded", groups),
        checklistItem("lines loaded", lines),
        checklistItem("orders loaded", orders),
        checklistItem("material readiness loaded", materialReadiness),
        checklistItem("WIP readiness loaded", wipReadiness),
        {
          label: "line contexts missing",
          status: lineContexts === 0 ? "waiting" : "loaded",
          count: lineContexts,
          detail:
            lineContexts === 0
              ? "No line_order_contexts rows exist yet."
              : "Line contexts exist.",
        },
        inactiveItem("downtime schema not active yet"),
        inactiveItem("production actuals not active yet"),
        {
          label: "auth/roles available for assignment",
          status: profiles > 0 ? "loaded" : "waiting",
          count: profiles,
          detail:
            profiles > 0
              ? "Profiles table is available for role-gated assignment writes."
              : "Assignment writes require authenticated users with profile roles.",
        },
      ],
    });
  } catch (error) {
    return errorResult(
      "Unable to load database readiness checklist.",
      getErrorMessage(error),
    );
  }
}

export async function getMaterialReadinessSummary(): Promise<
  FactoryDataResult<ReadinessSummary>
> {
  const result = await getMaterialWipReadinessData();

  if (result.status !== "success") {
    return result as FactoryDataResult<ReadinessSummary>;
  }

  return success({
    totalRows: result.data.material.totalRows,
    fabricStockRows: result.data.material.fabricStockRows,
    distribution: result.data.material.readinessDistribution,
  });
}

export async function getWipReadinessSummary(): Promise<
  FactoryDataResult<ReadinessSummary>
> {
  const result = await getMaterialWipReadinessData();

  if (result.status !== "success") {
    return result as FactoryDataResult<ReadinessSummary>;
  }

  return success({
    totalRows: result.data.wip.totalRows,
    cutPanelRows: result.data.wip.cutPanelRows,
    distribution: result.data.wip.readinessDistribution,
  });
}

export async function getImportBatchSummary(): Promise<
  FactoryDataResult<ImportBatchSummary>
> {
  return getImportBatches();
}

export async function getOrdersSummary(): Promise<
  FactoryDataResult<OrdersPlanningData>
> {
  return getOrdersPlanningData();
}

export async function getExecutiveSummary(): Promise<
  FactoryDataResult<ExecutiveSummary>
> {
  const result = await getExecutiveCommandCenterData();

  if (result.status !== "success") {
    return result as FactoryDataResult<ExecutiveSummary>;
  }

  return success({
    activeGroups: result.data.factoryStructure.activeGroups,
    productionLines: result.data.factoryStructure.productionLines,
    orders: result.data.planning.orders,
    materialReadinessRows: result.data.materialWip.materialReadinessRows,
    wipReadinessRows: result.data.materialWip.wipReadinessRows,
    importBatchesRequiringReview:
      result.data.imports.pendingApproval + result.data.imports.conflicts,
  });
}

async function getLineCardsFromView(): Promise<FactoryDataResult<LineCard[]>> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  const { data, error } = await client
    .from("line_card_view")
    .select("*")
    .limit(1000);

  if (error || !data || data.length === 0) {
    return empty();
  }

  const activeContexts = await getActiveLineContexts();
  const cards = (data as Record<string, unknown>[]).map((row) =>
    lineCardFromViewRow(row, activeContexts),
  );

  return success(cards);
}

async function getLineCardsFromBaseTables(): Promise<FactoryDataResult<LineCard[]>> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  const { data: lines, error: lineError } = await client
    .from("production_lines")
    .select(
      "id, line_code, group_id, line_prefix, line_number, is_active, is_special, production_groups(group_code, group_name)",
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
  const activeContexts = await getActiveLineContexts();

  const data = (lines as unknown as ProductionLineWithGroup[]).map((line) => {
    const state = statesByLine.get(line.id);
    const prefix = line.line_prefix ?? getLinePrefix(line.line_code);
    const group = getSingleRelationship(line.production_groups);
    const activeContext =
      activeContexts.get(line.id) ??
      (state?.current_context_id
        ? findContextById(activeContexts, state.current_context_id)
        : null);

    return {
      id: line.id,
      lineCode: line.line_code,
      linePrefix: prefix,
      lineNumber: line.line_number,
      groupId: line.group_id,
      groupCode: group?.group_code ?? null,
      groupName: group?.group_name ?? null,
      status: state?.line_status ?? "WAITING_FOR_DATA",
      stopReason: state?.stop_reason ?? null,
      feedPercent: state?.feed_percent ?? null,
      feedCoverDays: state?.feed_cover_days ?? null,
      qualityHold: state?.quality_hold ?? false,
      shipmentRisk: state?.shipment_risk ?? null,
      lastRefreshedAt: state?.last_refreshed_at ?? null,
      currentContextId: state?.current_context_id ?? null,
      activeContext,
      isActive: line.is_active,
      isSpecial: line.is_special,
      garmentType: getGarmentType(prefix),
    } satisfies LineCard;
  });

  return success(data);
}

async function getActiveLineContexts(): Promise<Map<string, ActiveLineContext>> {
  const client = ensureClient();

  if (!client) {
    return new Map();
  }

  const richResult = await client
    .from("line_order_contexts")
    .select(
      "id, line_id, order_id, customer_id, po_number, style_code, color_name, shipment_date, smv, planned_operators, planned_target_per_day, context_start_at, is_active, customers(customer_name), orders(order_code)",
    )
    .eq("is_active", true)
    .limit(1000);

  const fallbackResult = richResult.error
    ? await client
        .from("line_order_contexts")
        .select(
          "id, line_id, order_id, customer_id, po_number, style_code, color_name, shipment_date, smv, planned_operators, planned_target_per_day, context_start_at, is_active, orders(order_code)",
        )
        .eq("is_active", true)
        .limit(1000)
    : richResult;

  if (fallbackResult.error || !fallbackResult.data) {
    return new Map();
  }

  return new Map(
    (fallbackResult.data as unknown as Record<string, unknown>[]).flatMap((row) => {
      const lineId = asString(row.line_id);

      if (!lineId) {
        return [];
      }

      const context = activeContextFromRow(row);
      return [[lineId, context]];
    }),
  );
}

async function getAssignmentOrders(): Promise<Record<string, unknown>[]> {
  const client = ensureClient();

  if (!client) {
    return [];
  }

  const richResult = await client
    .from("orders")
    .select("*, customers(customer_name), style_master(style_code)")
    .limit(2000);

  if (!richResult.error && richResult.data) {
    return richResult.data as unknown as Record<string, unknown>[];
  }

  const customerResult = await client
    .from("orders")
    .select("*, customers(customer_name)")
    .limit(2000);

  if (!customerResult.error && customerResult.data) {
    return customerResult.data as unknown as Record<string, unknown>[];
  }

  const fallbackResult = await client.from("orders").select("*").limit(2000);

  if (fallbackResult.error || !fallbackResult.data) {
    return [];
  }

  return fallbackResult.data as unknown as Record<string, unknown>[];
}

async function getAssignmentRows(tableName: string): Promise<Record<string, unknown>[]> {
  const client = ensureClient();

  if (!client) {
    return [];
  }

  const { data, error } = await client.from(tableName).select("*").limit(5000);

  if (error || !data) {
    return [];
  }

  return data as unknown as Record<string, unknown>[];
}

async function getAssignmentAuthState(): Promise<LineAssignmentCenterData["auth"]> {
  const client = ensureClient();

  if (!client) {
    return {
      hasSession: false,
      roleLogicActive: false,
      canWrite: false,
      message: CONNECTION_REQUIRED,
    };
  }

  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    return {
      hasSession: false,
      roleLogicActive: false,
      canWrite: false,
      message: "Assignment writes require authentication.",
    };
  }

  return {
    hasSession: true,
    roleLogicActive: true,
    canWrite: false,
    message: "Browser role check is required before creating assignments.",
  };
}

async function getProfileReadinessCounts(): Promise<AuthProfileReadinessData> {
  const [profilesTotal, activeProfiles, assignmentAllowedProfiles] = await Promise.all([
    getCountSafe("profiles"),
    getFilteredCountSafe("profiles", "is_active", true),
    getAssignmentAllowedProfileCount(),
  ]);

  return {
    profilesTotal,
    activeProfiles,
    assignmentAllowedProfiles,
  };
}

async function getAssignmentAllowedProfileCount() {
  const client = ensureClient();

  if (!client) {
    return 0;
  }

  const { count, error } = await client
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .in("role", ["ADMIN", "MANAGER", "PLANNING"]);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

async function getOrdersByCustomer(): Promise<LabelCount[]> {
  const client = ensureClient();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("orders")
    .select("customer_id, customers(customer_name)")
    .limit(5000);

  if (error || !data) {
    return [];
  }

  const byCustomerMap = new Map<string, number>();

  for (const row of data as unknown as Array<{
    customers: { customer_name: string } | { customer_name: string }[] | null;
  }>) {
    const customer = getSingleRelationship(row.customers);
    const name = customer?.customer_name ?? "Unassigned customer";
    byCustomerMap.set(name, (byCustomerMap.get(name) ?? 0) + 1);
  }

  return Array.from(byCustomerMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

async function getNearestShipmentDates() {
  const client = ensureClient();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("orders")
    .select("order_code, shipment_date, customers(customer_name)")
    .not("shipment_date", "is", null)
    .order("shipment_date", { ascending: true })
    .limit(8);

  if (error || !data) {
    return [];
  }

  return (data as unknown as Array<{
    order_code: string | null;
    shipment_date: string | null;
    customers: { customer_name: string } | { customer_name: string }[] | null;
  }>).map((row) => ({
    orderCode: row.order_code ?? "Uncoded order",
    customerName:
      getSingleRelationship(row.customers)?.customer_name ?? "Unassigned customer",
    shipmentDate: row.shipment_date ?? "",
  }));
}

async function getWeekQuantitySummary() {
  const client = ensureClient();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("production_plan_daily_quantities")
    .select("*")
    .limit(5000);

  if (error || !data) {
    return [];
  }

  const weekMap = new Map<string, { rows: number; quantity: number }>();

  for (const row of data as Record<string, unknown>[]) {
    const week = inferWeek(row);

    if (!week || !WEEK_RANGE.has(week)) {
      continue;
    }

    const quantity = inferQuantity(row);
    const current = weekMap.get(week) ?? { rows: 0, quantity: 0 };
    current.rows += 1;
    current.quantity += quantity ?? 0;
    weekMap.set(week, current);
  }

  return Array.from(WEEK_RANGE)
    .map((week) => {
      const value = weekMap.get(week);

      return {
        week: `Week ${week}`,
        rows: value?.rows ?? 0,
        quantity: value && value.rows > 0 ? value.quantity : null,
      };
    })
    .filter((item) => item.rows > 0);
}

async function getStatusDistribution(
  tableName: string,
  columnName: string,
): Promise<StatusCount[]> {
  const client = ensureClient();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from(tableName)
    .select(columnName)
    .limit(5000);

  if (error || !data) {
    return [];
  }

  return summarizeStatuses(
    (data as unknown as Record<string, unknown>[])
      .map((row) => asString(row[columnName]))
      .filter((value): value is string => Boolean(value)),
  );
}

async function getWipFeedCoverSummary(): Promise<
  MaterialWipReadinessData["wip"]["feedCoverSummary"]
> {
  const client = ensureClient();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("wip_readiness")
    .select(
      "customer_id, sewing_type, sub_type, feed_percent, feed_cover_days, customers(customer_name)",
    )
    .limit(5000);

  if (error || !data) {
    return [];
  }

  const groups = new Map<
    string,
    {
      customerName: string;
      sewingType: string;
      subType: string;
      rows: number;
      feedPercentTotal: number;
      feedPercentRows: number;
      feedCoverDaysTotal: number;
      feedCoverDaysRows: number;
    }
  >();

  for (const row of data as Record<string, unknown>[]) {
    const customer = getSingleRelationship(
      row.customers as { customer_name: string } | { customer_name: string }[] | null,
    );
    const customerName = customer?.customer_name ?? "Unassigned customer";
    const sewingType = asString(row.sewing_type) ?? "Unspecified sewing type";
    const subType = asString(row.sub_type) ?? "Unspecified sub type";
    const key = `${customerName}|${sewingType}|${subType}`;
    const current =
      groups.get(key) ??
      {
        customerName,
        sewingType,
        subType,
        rows: 0,
        feedPercentTotal: 0,
        feedPercentRows: 0,
        feedCoverDaysTotal: 0,
        feedCoverDaysRows: 0,
      };
    const feedPercent = asNumber(row.feed_percent);
    const feedCoverDays = asNumber(row.feed_cover_days);

    current.rows += 1;

    if (feedPercent !== null) {
      current.feedPercentTotal += feedPercent;
      current.feedPercentRows += 1;
    }

    if (feedCoverDays !== null) {
      current.feedCoverDaysTotal += feedCoverDays;
      current.feedCoverDaysRows += 1;
    }

    groups.set(key, current);
  }

  return Array.from(groups.values())
    .map((item) => ({
      customerName: item.customerName,
      sewingType: item.sewingType,
      subType: item.subType,
      rows: item.rows,
      averageFeedPercent:
        item.feedPercentRows > 0
          ? Math.round(item.feedPercentTotal / item.feedPercentRows)
          : null,
      averageFeedCoverDays:
        item.feedCoverDaysRows > 0
          ? Number((item.feedCoverDaysTotal / item.feedCoverDaysRows).toFixed(1))
          : null,
    }))
    .sort((a, b) => b.rows - a.rows)
    .slice(0, 12);
}

async function getImportBatches(): Promise<FactoryDataResult<ImportBatchSummary>> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  const richResult = await client
    .from("import_batches")
    .select(
      "id, target_domain, import_name, import_status, total_rows, valid_rows, conflict_rows, created_at, applied_at, source_files(file_name, uploaded_at)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (!richResult.error && richResult.data) {
    return importBatchResult(richResult.data, richResult.count);
  }

  const fallbackResult = await client
    .from("import_batches")
    .select(
      "id, target_domain, import_name, import_status, total_rows, valid_rows, conflict_rows, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (fallbackResult.error) {
    return errorResult("Unable to load import batches.", fallbackResult.error.message);
  }

  if (!fallbackResult.data || fallbackResult.data.length === 0) {
    return empty();
  }

  return importBatchResult(fallbackResult.data, fallbackResult.count);
}

function importBatchResult(
  data: unknown[],
  count: number | null,
): FactoryDataResult<ImportBatchSummary> {
  const batches = (data as Record<string, unknown>[]).map((row) => {
    const source = getSingleRelationship(
      row.source_files as
        | { file_name?: string | null; uploaded_at?: string | null }
        | { file_name?: string | null; uploaded_at?: string | null }[]
        | null,
    );

    return {
      id: asString(row.id) ?? "",
      target_domain: (asString(row.target_domain) ?? "OTHER") as ImportDomain,
      import_name: asString(row.import_name) ?? "Unnamed import",
      import_status: (asString(row.import_status) ?? "UPLOADED") as ImportStatus,
      total_rows: asNumber(row.total_rows) ?? 0,
      valid_rows: asNumber(row.valid_rows) ?? 0,
      conflict_rows: asNumber(row.conflict_rows) ?? 0,
      created_at: asString(row.created_at) ?? "",
      applied_at: asString(row.applied_at),
      uploaded_at: source?.uploaded_at ?? null,
      source_file_name: source?.file_name ?? null,
    };
  });

  const pendingApproval = batches.filter(
    (batch) => batch.import_status === "PENDING_APPROVAL",
  ).length;
  const applied = batches.filter((batch) => batch.import_status === "APPLIED").length;
  const conflicts = batches.filter(
    (batch) => batch.import_status === "CONFLICTS_FOUND",
  ).length;

  return success({
    totalBatches: count ?? batches.length,
    requiringReview: pendingApproval + conflicts,
    pendingApproval,
    applied,
    conflicts,
    batches,
  });
}

function buildGroupZones(groups: ProductionGroup[], lines: LineCard[]) {
  const groupsByCode = new Map(groups.map((group) => [group.group_code, group]));
  const linesByGroup = new Map<string, LineCard[]>();

  for (const line of lines) {
    if (!line.groupCode) {
      continue;
    }

    const current = linesByGroup.get(line.groupCode) ?? [];
    current.push(line);
    linesByGroup.set(line.groupCode, current);
  }

  return GROUP_ORDER.map((groupCode, index) => {
    const existing = groupsByCode.get(groupCode);
    const groupLines = linesByGroup.get(groupCode) ?? [];

    return {
      id: existing?.id ?? groupCode,
      group_code: groupCode,
      group_name: existing?.group_name ?? groupCode,
      display_order: existing?.display_order ?? index + 1,
      is_active: existing?.is_active ?? groupCode !== "G-11",
      is_ghost: existing?.is_ghost ?? groupCode === "G-11",
      lines: groupLines,
      waitingLines: groupLines.filter((line) => line.status === "WAITING_FOR_DATA")
        .length,
      activeContextLines: groupLines.filter((line) => line.activeContext !== null)
        .length,
    } satisfies GroupWithLines;
  });
}

function lineCardFromViewRow(
  row: Record<string, unknown>,
  activeContexts: Map<string, ActiveLineContext>,
): LineCard {
  const id = asString(row.line_id) ?? asString(row.id) ?? "";
  const lineCode = asString(row.line_code) ?? asString(row.lineCode) ?? "Unknown line";
  const prefix = asString(row.line_prefix) ?? getLinePrefix(lineCode);
  const contextId = asString(row.current_context_id);
  const activeContext =
    activeContexts.get(id) ?? (contextId ? findContextById(activeContexts, contextId) : null);

  return {
    id,
    lineCode,
    linePrefix: prefix,
    lineNumber: asString(row.line_number),
    groupId: asString(row.group_id),
    groupCode: asString(row.group_code),
    groupName: asString(row.group_name),
    status: (asString(row.line_status) ?? "WAITING_FOR_DATA") as LineStatus,
    stopReason: asString(row.stop_reason),
    feedPercent: asNumber(row.feed_percent),
    feedCoverDays: asNumber(row.feed_cover_days),
    qualityHold: asBoolean(row.quality_hold),
    shipmentRisk: asString(row.shipment_risk),
    lastRefreshedAt: asString(row.last_refreshed_at),
    currentContextId: contextId,
    activeContext,
    isActive: asBoolean(row.is_active, true),
    isSpecial: asBoolean(row.is_special),
    garmentType: getGarmentType(prefix),
  };
}

function activeContextFromRow(row: Record<string, unknown>): ActiveLineContext {
  const order = getSingleRelationship(
    row.orders as
      | {
          order_code?: string | null;
        }
      | {
          order_code?: string | null;
        }[]
      | null,
  );
  const customer = getSingleRelationship(
    row.customers as
      | { customer_name?: string | null }
      | { customer_name?: string | null }[]
      | null,
  );

  return {
    id: asString(row.id) ?? "",
    lineId: asString(row.line_id),
    orderId: asString(row.order_id),
    customerId: asString(row.customer_id),
    orderCode: order?.order_code ?? null,
    poNumber: asString(row.po_number),
    customerName: customer?.customer_name ?? null,
    styleCode: asString(row.style_code),
    colorName: asString(row.color_name),
    shipmentDate: asString(row.shipment_date),
    smv: asNumber(row.smv),
    plannedOperators: asNumber(row.planned_operators),
    plannedTargetPerDay: asNumber(row.planned_target_per_day),
    contextStartAt: asString(row.context_start_at),
    isActive: asBoolean(row.is_active),
  };
}

function findContextById(
  contexts: Map<string, ActiveLineContext>,
  contextId: string,
) {
  return (
    Array.from(contexts.values()).find((context) => context.id === contextId) ?? null
  );
}

function assignmentOrderFromRow(
  row: Record<string, unknown>,
  materialRows: Record<string, unknown>[],
  exactWipRows: Record<string, unknown>[],
  customerWipRows: Record<string, unknown>[],
): LineAssignmentOrder {
  const customer = getSingleRelationship(
    row.customers as { customer_name?: string | null } | { customer_name?: string | null }[] | null,
  );
  const style = getSingleRelationship(
    row.style_master as { style_code?: string | null } | { style_code?: string | null }[] | null,
  );
  const materialStatus = summarizeRowStatuses(materialRows, [
    "readiness_status",
    "material_status",
    "status",
  ]);
  const wipMatchType =
    exactWipRows.length > 0
      ? "order"
      : customerWipRows.length > 0
        ? "customer_level"
        : "none";
  const warnings: string[] = [];

  if (!materialStatus) {
    warnings.push("Order has no material readiness record.");
  }

  if (materialStatus === "BLOCKED") {
    warnings.push("Order has blocked material readiness.");
  }

  if (wipMatchType === "customer_level") {
    warnings.push(
      "WIP exists at customer/sewing-type/sub-type level and needs planning confirmation.",
    );
  }

  if (wipMatchType === "none") {
    warnings.push("Order has no matching WIP readiness record yet.");
  }

  return {
    id: asString(row.id) ?? "",
    orderCode:
      asString(row.order_code) ??
      asString(row.order_no) ??
      asString(row.code) ??
      "Uncoded order",
    poNumber:
      asString(row.po_number) ??
      asString(row.customer_po) ??
      asString(row.po) ??
      null,
    customerId: asString(row.customer_id),
    customerName:
      customer?.customer_name ??
      asString(row.customer_name) ??
      "Unassigned customer",
    styleCode:
      style?.style_code ??
      asString(row.style_code) ??
      asString(row.style_no) ??
      null,
    colorName: asString(row.color_name) ?? asString(row.color) ?? null,
    shipmentDate:
      asString(row.shipment_date) ??
      asString(row.ex_factory_date) ??
      asString(row.delivery_date) ??
      null,
    orderQuantity:
      asNumber(row.order_quantity) ??
      asNumber(row.total_quantity) ??
      asNumber(row.quantity) ??
      asNumber(row.qty),
    orderStatus:
      asString(row.order_status) ??
      asString(row.status) ??
      asString(row.production_status),
    materialReadinessStatus: materialStatus,
    wipReadinessHint:
      wipMatchType === "order"
        ? `${exactWipRows.length} WIP readiness row(s) linked to this order.`
        : wipMatchType === "customer_level"
          ? "WIP exists at customer/sewing-type/sub-type level and needs planning confirmation."
          : null,
    wipMatchType,
    warnings,
  };
}

function groupRowsByKey(rows: Record<string, unknown>[], key: string) {
  const grouped = new Map<string, Record<string, unknown>[]>();

  for (const row of rows) {
    const value = asString(row[key]);

    if (!value) {
      continue;
    }

    const current = grouped.get(value) ?? [];
    current.push(row);
    grouped.set(value, current);
  }

  return grouped;
}

function summarizeRowStatuses(
  rows: Record<string, unknown>[],
  candidateColumns: string[],
) {
  const statuses = new Set<string>();

  for (const row of rows) {
    for (const column of candidateColumns) {
      const value = asString(row[column]);

      if (value) {
        statuses.add(value);
      }
    }
  }

  if (statuses.size === 0) {
    return null;
  }

  if (statuses.size === 1) {
    return Array.from(statuses)[0];
  }

  if (statuses.has("BLOCKED")) {
    return "BLOCKED";
  }

  return "MULTIPLE";
}

function isOpenOrderRow(row: Record<string, unknown>) {
  const status = (
    asString(row.order_status) ??
    asString(row.status) ??
    asString(row.production_status) ??
    ""
  ).toUpperCase();

  if (!status) {
    return true;
  }

  return !["CLOSED", "CANCELLED", "CANCELED", "SHIPPED", "COMPLETE", "COMPLETED"].includes(
    status,
  );
}

function statusItem(label: string, loaded: boolean) {
  return {
    label,
    state: loaded ? "loaded" : "waiting",
    detail: loaded ? "Real rows are available." : WAITING_FOR_REAL_DATA,
  } satisfies ExecutiveCommandCenterData["foundationStatus"][number];
}

function checklistItem(label: string, count: number) {
  return {
    label,
    status: count > 0 ? "loaded" : "missing",
    count,
    detail: count > 0 ? `${count} real rows available.` : WAITING_FOR_REAL_DATA,
  } satisfies DatabaseReadinessChecklist["items"][number];
}

function inactiveItem(label: string) {
  return {
    label,
    status: "inactive",
    count: null,
    detail: "Not activated in this foundation visibility phase.",
  } satisfies DatabaseReadinessChecklist["items"][number];
}

function summarizeStatuses(statuses: string[]) {
  const counts = new Map<string, number>();

  for (const status of statuses) {
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

function lineToCurrentState(line: LineCard): LineDetailData["currentState"] {
  return {
    line_status: line.status,
    stop_reason: line.stopReason,
    feed_percent: line.feedPercent,
    feed_cover_days: line.feedCoverDays,
    quality_hold: line.qualityHold,
    shipment_risk: line.shipmentRisk,
    last_refreshed_at: line.lastRefreshedAt,
    current_context_id: line.currentContextId,
  };
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
  qualityHold = false,
) {
  if (status === "CHANGEOVER") {
    return "changeover";
  }

  if (qualityHold || status === "QUALITY_HOLD") {
    return "quality_hold";
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

function inferWeek(row: Record<string, unknown>) {
  const candidates = [
    row.week,
    row.week_no,
    row.week_number,
    row.plan_week,
    row.production_week,
  ];
  const value = candidates.find((item) => item !== null && item !== undefined);

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    const match = value.match(/\d+/);
    return match?.[0] ?? null;
  }

  return null;
}

function inferQuantity(row: Record<string, unknown>) {
  const candidates = [
    row.quantity,
    row.plan_quantity,
    row.planned_quantity,
    row.daily_quantity,
    row.target_quantity,
    row.qty,
  ];

  for (const candidate of candidates) {
    const value = asNumber(candidate);

    if (value !== null) {
      return value;
    }
  }

  return null;
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

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return fallback;
}

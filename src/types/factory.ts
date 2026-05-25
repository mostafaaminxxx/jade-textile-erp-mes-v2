import type {
  ImportBatch,
  ImportStatus,
  LineStatus,
  ProductionGroup,
  ProductionLine,
} from "@/types/database";

export interface DataSuccess<T> {
  status: "success";
  data: T;
}

export interface DataEmpty {
  status: "empty";
  message: string;
}

export interface DataError {
  status: "error";
  message: string;
  cause?: string;
}

export interface DataNotConfigured {
  status: "not_configured";
  message: string;
}

export type FactoryDataResult<T> =
  | DataSuccess<T>
  | DataEmpty
  | DataError
  | DataNotConfigured;

export interface ActiveLineContext {
  id: string;
  lineId: string | null;
  orderId: string | null;
  customerId: string | null;
  orderCode: string | null;
  poNumber: string | null;
  customerName: string | null;
  styleCode: string | null;
  colorName: string | null;
  shipmentDate: string | null;
  orderQuantity: number | null;
  smv: number | null;
  plannedOperators: number | null;
  plannedTargetPerDay: number | null;
  contextStartAt: string | null;
  changeReason: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  isActive: boolean | null;
  materialReadinessStatus: string | null;
  fabricStatus: string | null;
  accessoryStatus: string | null;
  wipReadinessStatus: string | null;
  wipReadinessHint: string | null;
}

export interface LineCard {
  id: string;
  lineCode: string;
  linePrefix: string;
  lineNumber: string | null;
  groupId: string | null;
  groupCode: string | null;
  groupName: string | null;
  status: LineStatus;
  stopReason: string | null;
  feedPercent: number | null;
  feedCoverDays: number | null;
  actualToday?: number | null;
  targetToday?: number | null;
  qualityHold: boolean;
  shipmentRisk: string | null;
  lastRefreshedAt: string | null;
  currentContextId: string | null;
  activeContext: ActiveLineContext | null;
  isActive: boolean;
  isSpecial: boolean;
  garmentType: string;
}

export interface GroupWithLines extends ProductionGroup {
  lines: LineCard[];
  waitingLines: number;
  activeContextLines: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface LabelCount {
  label: string;
  count: number;
}

export interface CountSummary {
  total: number;
}

export interface ExecutiveCommandCenterData {
  factoryStructure: {
    groups: number;
    activeGroups: number;
    ghostGroups: number;
    productionLines: number;
  };
  planning: {
    orders: number;
    productionPlans: number;
    orderOperationRoutes: number;
    weeklyPlanRows: number;
  };
  materialWip: {
    materialReadinessRows: number;
    fabricStockRows: number;
    cutPanelWipRows: number;
    wipReadinessRows: number;
  };
  lineExecution: {
    lineCurrentStateRows: number;
    waitingForDataLines: number;
    lineOrderContexts: number;
    activeLineOrderContexts: number;
  };
  imports: {
    importBatches: number;
    pendingApproval: number;
    applied: number;
    conflicts: number;
  };
  foundationStatus: Array<{
    label: string;
    state: "loaded" | "waiting" | "inactive";
    detail: string;
  }>;
}

export interface FactoryMapData {
  groups: ProductionGroup[];
  lines: LineCard[];
  groupZones: GroupWithLines[];
  summary: {
    groupCount: number;
    lineCount: number;
    waitingLineCount: number;
    activeContextCount: number;
  };
}

export interface GroupDetailData {
  group: ProductionGroup;
  lines: LineCard[];
  statusDistribution: StatusCount[];
  waitingLineCount: number;
  activeContextLineCount: number;
}

export interface LineDetailData {
  line: LineCard;
  currentState: {
    line_status: LineStatus;
    stop_reason: string | null;
    feed_percent: number | null;
    feed_cover_days: number | null;
    actual_today?: number | null;
    target_today?: number | null;
    quality_hold: boolean;
    shipment_risk: string | null;
    last_refreshed_at: string | null;
    current_context_id: string | null;
  } | null;
}

export interface OrdersPlanningData {
  totalOrders: number;
  productionPlans: number;
  routeCount: number;
  dailyQuantityRows: number;
  lineOrderContexts: number;
  activeLineOrderContexts: number;
  waitingLines: number;
  byCustomer: LabelCount[];
  nearestShipmentDates: Array<{
    orderCode: string;
    customerName: string;
    shipmentDate: string;
  }>;
  weekQuantitySummary: Array<{
    week: string;
    rows: number;
    quantity: number | null;
  }>;
}

export interface LineAssignmentOrder {
  id: string;
  orderCode: string;
  poNumber: string | null;
  customerId: string | null;
  customerName: string;
  styleCode: string | null;
  colorName: string | null;
  shipmentDate: string | null;
  orderQuantity: number | null;
  orderStatus: string | null;
  materialReadinessStatus: string | null;
  wipReadinessHint: string | null;
  wipMatchType: "order" | "customer_level" | "none";
  warnings: string[];
}

export interface LineAssignmentCenterData {
  groups: ProductionGroup[];
  availableLines: LineCard[];
  linesWithActiveContext: number;
  linesWaitingForContext: number;
  openOrders: LineAssignmentOrder[];
  ordersWithMaterialReadiness: number;
  ordersWithWipReadiness: number;
  currentActiveLineContexts: ActiveLineContext[];
  warnings: string[];
  auth: {
    hasSession: boolean;
    roleLogicActive: boolean;
    canWrite: boolean;
    message: string;
  };
  profileReadiness: AuthProfileReadinessData;
}

export type AssignmentStatusCode = "AVAILABLE" | "ASSIGNED" | "NOT_ASSIGNABLE";

export type ExecutionReadinessStatus =
  | "NOT_STARTED"
  | "WAITING_FOR_EXECUTION_DATA"
  | "READY_TO_START"
  | "RUNNING"
  | "PAUSED_STOPPED"
  | "QUALITY_HOLD"
  | "NO_FEEDING"
  | "COMPLETED_OR_CLOSED";

export interface ProductionExecutionLine extends LineCard {
  assignmentStatus: AssignmentStatusCode;
  executionReadinessStatus: ExecutionReadinessStatus;
  executionReadinessBlockers: string[];
  hasActiveExecutionSession: boolean;
  canStartProductionDerived: boolean;
}

export interface ProductionExecutionReadinessRow {
  lineId: string;
  lineCode: string;
  groupId: string | null;
  groupCode: string | null;
  groupName: string | null;
  currentContextId: string | null;
  contextId: string | null;
  orderId: string | null;
  orderCode: string | null;
  customerId: string | null;
  customerName: string | null;
  styleCode: string | null;
  colorName: string | null;
  shipmentDate: string | null;
  lineStatus: LineStatus;
  assignmentStatus: AssignmentStatusCode;
  executionReadinessStatus: ExecutionReadinessStatus;
  readinessBlockers: string[];
  feedPercent: number | null;
  feedCoverDays: number | null;
  actualToday: number | null;
  targetToday: number | null;
  lastRefreshedAt: string | null;
}

export interface ProductionExecutionSchemaStatus {
  readinessViewAvailable: boolean;
  sessionsTableAvailable: boolean;
  eventsTableAvailable: boolean;
  sessionsCount: number;
  eventsCount: number;
}

export interface ProductionExecutionData {
  summary: {
    totalLines: number;
    assignedLines: number;
    readyToStartLines: number;
    runningSessions: number;
    blockedLines: number;
  };
  schemaStatus: ProductionExecutionSchemaStatus;
  executionTables: {
    sessionsTableAvailable: boolean;
    eventsTableAvailable: boolean;
  };
  allLines: ProductionExecutionLine[];
  lines: ProductionExecutionLine[];
  readyLines: ProductionExecutionLine[];
  blockedLines: ProductionExecutionLine[];
  warnings: string[];
}

export type ProductionExecutionReadinessData = ProductionExecutionData;

export interface ProductionExecutionSessionReview {
  id: string;
  lineId: string | null;
  lineCode: string | null;
  groupCode: string | null;
  contextId: string | null;
  orderId: string | null;
  orderCode: string | null;
  customerName: string | null;
  styleCode: string | null;
  colorName: string | null;
  status: string;
  startedAt: string | null;
  startedBy: string | null;
  startedByName: string | null;
  startReason: string | null;
  endedAt: string | null;
  endedBy: string | null;
  endedByName: string | null;
  endReason: string | null;
}

export interface ProductionExecutionEventReview {
  id: string;
  sessionId: string | null;
  lineId: string | null;
  lineCode: string | null;
  contextId: string | null;
  eventType: string;
  fromStatus: string | null;
  toStatus: string;
  eventAt: string | null;
  eventBy: string | null;
  eventByName: string | null;
  reason: string | null;
  metadata: unknown;
}

export interface ProductionExecutionHistoryData {
  summary: {
    totalSessions: number;
    activeSessions: number;
    closedSessions: number;
    totalEvents: number;
    startEvents: number;
    latestEventAt: string | null;
    sessionsTableAvailable: boolean;
    eventsTableAvailable: boolean;
  };
  sessions: ProductionExecutionSessionReview[];
  events: ProductionExecutionEventReview[];
  warnings: string[];
}

export interface ReadinessSummary {
  totalRows: number;
  fabricStockRows?: number;
  cutPanelRows?: number;
  distribution: StatusCount[];
}

export interface MaterialWipReadinessData {
  material: {
    totalRows: number;
    readinessDistribution: StatusCount[];
    fabricStatusSummary: StatusCount[];
    accessoryStatusSummary: StatusCount[];
    fabricStockRows: number;
  };
  wip: {
    totalRows: number;
    readinessDistribution: StatusCount[];
    cutPanelRows: number;
    feedCoverSummary: Array<{
      customerName: string;
      sewingType: string;
      subType: string;
      rows: number;
      averageFeedPercent: number | null;
      averageFeedCoverDays: number | null;
    }>;
  };
}

export interface ReportsImportsData {
  sourceFiles: number;
  totalBatches: number;
  pendingApproval: number;
  applied: number;
  conflicts: number;
  batches: Array<
    Pick<
      ImportBatch,
      | "id"
      | "target_domain"
      | "import_name"
      | "import_status"
      | "total_rows"
      | "valid_rows"
      | "conflict_rows"
      | "created_at"
    > & {
      applied_at?: string | null;
      uploaded_at?: string | null;
      source_file_name?: string | null;
    }
  >;
}

export interface ImportBatchSummary {
  totalBatches: number;
  requiringReview: number;
  pendingApproval: number;
  applied: number;
  conflicts: number;
  batches: ReportsImportsData["batches"];
}

export interface DatabaseReadinessChecklist {
  supabaseConfigured: boolean;
  projectUrl: string;
  env: {
    hasUrl: boolean;
    hasAnonKey: boolean;
    exposesServiceRole: false;
  };
  items: Array<{
    label: string;
    status: "loaded" | "missing" | "waiting" | "inactive";
    count: number | null;
    detail: string;
  }>;
}

export interface AuthProfileReadinessData {
  profilesTotal: number;
  activeProfiles: number;
  assignmentAllowedProfiles: number;
}

export interface PreviewTestCenterData {
  environment: {
    supabaseConfigured: boolean;
    hasProjectUrl: boolean;
    hasAnonKey: boolean;
    projectUrl: string;
    exposesServiceRole: false;
  };
  databaseCounts: {
    customers: number;
    productionGroups: number;
    productionLines: number;
    styleMaster: number;
    orders: number;
    productionPlans: number;
    materialReadiness: number;
    wipReadiness: number;
    profiles: number;
    activeProfiles: number;
    assignmentAllowedProfiles: number;
    lineOrderContexts: number;
    lineCurrentStateWithContext: number;
  };
  readiness: {
    supabaseConnected: boolean;
    hasRealLines: boolean;
    hasRealOrders: boolean;
    hasAssignmentAllowedProfile: boolean;
    assignmentRpcConfigured: boolean;
    feedFieldsProtected: boolean;
  };
  warnings: string[];
}

export interface ExecutiveSummary {
  activeGroups: number;
  productionLines: number;
  orders: number;
  materialReadinessRows: number;
  wipReadinessRows: number;
  importBatchesRequiringReview: number;
}

export interface ProductionLineWithGroup extends ProductionLine {
  production_groups:
    | {
        group_code: string;
        group_name?: string | null;
      }
    | {
        group_code: string;
        group_name?: string | null;
      }[]
    | null;
}

export type LineVisualPriority =
  | "changeover"
  | "no_feeding"
  | "quality_hold"
  | "stopped"
  | "running"
  | "waiting";

export type ImportStatusCount = Record<ImportStatus, number>;

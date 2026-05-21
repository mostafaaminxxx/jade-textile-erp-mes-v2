import type {
  ImportBatch,
  LineStatus,
  ProductionGroup,
  ProductionLine,
  ReadinessStatus,
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

export interface LineCard {
  id: string;
  lineCode: string;
  linePrefix: string;
  lineNumber: string | null;
  groupId: string | null;
  groupCode: string | null;
  status: LineStatus;
  stopReason: string | null;
  feedPercent: number | null;
  isActive: boolean;
  garmentType: string;
}

export interface GroupWithLines extends ProductionGroup {
  lines: LineCard[];
}

export interface CountSummary {
  total: number;
}

export interface OrdersSummary {
  totalOrders: number;
  productionPlans: number;
  routeCount: number;
  dailyQuantityRows: number;
  byCustomer: Array<{
    customerName: string;
    count: number;
  }>;
  nearestShipmentDates: Array<{
    orderCode: string;
    customerName: string;
    shipmentDate: string;
  }>;
}

export interface ReadinessSummary {
  totalRows: number;
  fabricStockRows?: number;
  cutPanelRows?: number;
  distribution: Array<{
    status: ReadinessStatus;
    count: number;
  }>;
}

export interface ImportBatchSummary {
  totalBatches: number;
  requiringReview: number;
  batches: Pick<
    ImportBatch,
    | "id"
    | "target_domain"
    | "import_name"
    | "import_status"
    | "total_rows"
    | "valid_rows"
    | "conflict_rows"
    | "created_at"
  >[];
}

export interface ExecutiveSummary {
  activeGroups: number;
  productionLines: number;
  orders: number;
  materialReadinessRows: number;
  wipReadinessRows: number;
  importBatchesRequiringReview: number;
}

export type LineVisualPriority =
  | "changeover"
  | "no_feeding"
  | "stopped"
  | "running"
  | "waiting";

export interface ProductionLineWithGroup extends ProductionLine {
  production_groups:
    | {
        group_code: string;
      }
    | {
        group_code: string;
      }[]
    | null;
}

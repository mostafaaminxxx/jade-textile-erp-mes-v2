export type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "PLANNING"
  | "PRODUCTION"
  | "SUPERVISOR"
  | "MAINTENANCE"
  | "QUALITY"
  | "WAREHOUSE"
  | "VIEWER";

export type LineStatus =
  | "WAITING_FOR_DATA"
  | "RUNNING"
  | "STOPPED"
  | "CHANGEOVER"
  | "QUALITY_HOLD"
  | "NO_FEEDING"
  | "INACTIVE";

export type ReadinessStatus =
  | "WAITING_FOR_DATA"
  | "READY"
  | "PARTIAL"
  | "RISK"
  | "BLOCKED"
  | "UNKNOWN";

export type ImportStatus =
  | "UPLOADED"
  | "PARSED"
  | "VALIDATED"
  | "CONFLICTS_FOUND"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "APPLIED"
  | "REJECTED"
  | "FAILED";

export type ImportDomain =
  | "LAYOUT"
  | "CUSTOMER_STYLE_MASTER"
  | "PRODUCTION_PLAN"
  | "AUTOMATION_PLAN"
  | "FABRIC_STOCK"
  | "CUT_PANEL_WIP"
  | "PRODUCTION_REPORT"
  | "DAILY_PERFORMANCE"
  | "SHIPMENT_RISK"
  | "OTHER";

export interface Customer {
  id: string;
  customer_name: string;
  customer_code: string | null;
  customer_color_key: string | null;
  is_active: boolean;
}

export interface ProductionGroup {
  id: string;
  group_code: string;
  group_name: string | null;
  display_order: number;
  is_active: boolean;
  is_ghost: boolean;
}

export interface ProductionLine {
  id: string;
  line_code: string;
  group_id: string | null;
  line_prefix: string | null;
  line_number: string | null;
  is_active: boolean;
  is_special: boolean;
}

export interface LineCurrentState {
  line_id: string;
  current_context_id: string | null;
  line_status: LineStatus;
  stop_reason: string | null;
  feed_percent: number | null;
  feed_cover_days: number | null;
  actual_today: number;
  target_today: number;
  required_operators: number | null;
  actual_operators: number | null;
  quality_hold: boolean;
  shipment_risk: string | null;
  last_event_at: string | null;
  last_refreshed_at: string;
}

export interface MaterialReadiness {
  id: string;
  order_id: string | null;
  customer_id: string | null;
  project_code: string | null;
  color_name: string | null;
  readiness_status: ReadinessStatus;
  fabric_ready_qty: number;
  required_qty: number;
  shortage_qty: number;
}

export interface WipReadiness {
  id: string;
  order_id: string | null;
  line_id: string | null;
  customer_id: string | null;
  project_code: string | null;
  color_name: string | null;
  readiness_status: ReadinessStatus;
  total_available_qty: number;
  feed_percent: number | null;
}

export interface ImportBatch {
  id: string;
  source_file_id: string;
  import_name: string;
  import_status: ImportStatus;
  target_domain: ImportDomain;
  total_rows: number;
  valid_rows: number;
  conflict_rows: number;
  created_at: string;
}

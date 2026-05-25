"use client";

import {
  getSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import type {
  FactoryDataResult,
  ProductionExecutionEventReview,
  ProductionExecutionHistoryData,
  ProductionExecutionSessionReview,
} from "@/types/factory";

type RawSessionRow = {
  id?: string | null;
  line_id?: string | null;
  context_id?: string | null;
  order_id?: string | null;
  status?: string | null;
  started_at?: string | null;
  started_by?: string | null;
  start_reason?: string | null;
  ended_at?: string | null;
  ended_by?: string | null;
  end_reason?: string | null;
};

type RawEventRow = {
  id?: string | null;
  session_id?: string | null;
  line_id?: string | null;
  context_id?: string | null;
  event_type?: string | null;
  from_status?: string | null;
  to_status?: string | null;
  event_at?: string | null;
  event_by?: string | null;
  reason?: string | null;
  metadata?: unknown;
};

type LineLookup = Record<string, { lineCode: string | null; groupCode: string | null }>;
type ContextLookup = Record<
  string,
  {
    orderId: string | null;
    orderCode: string | null;
    customerName: string | null;
    styleCode: string | null;
    colorName: string | null;
  }
>;
type ProfileLookup = Record<string, string | null>;

function notConfigured<T>(): FactoryDataResult<T> {
  return {
    status: "not_configured",
    message: "Supabase connection required.",
  };
}

function success<T>(data: T): FactoryDataResult<T> {
  return {
    status: "success",
    data,
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

export async function getProductionExecutionHistoryData(): Promise<
  FactoryDataResult<ProductionExecutionHistoryData>
> {
  const client = ensureClient();

  if (!client) {
    return notConfigured();
  }

  const [sessionsResult, eventsResult] = await Promise.all([
    client
      .from("production_execution_sessions")
      .select(
        [
          "id",
          "line_id",
          "context_id",
          "order_id",
          "status",
          "started_at",
          "started_by",
          "start_reason",
          "ended_at",
          "ended_by",
          "end_reason",
        ].join(","),
      )
      .order("started_at", { ascending: false })
      .limit(100),
    client
      .from("production_execution_events")
      .select(
        [
          "id",
          "session_id",
          "line_id",
          "context_id",
          "event_type",
          "from_status",
          "to_status",
          "event_at",
          "event_by",
          "reason",
          "metadata",
        ].join(","),
      )
      .order("event_at", { ascending: false })
      .limit(200),
  ]);

  const sessionsTableAvailable = !sessionsResult.error;
  const eventsTableAvailable = !eventsResult.error;

  if (!sessionsTableAvailable && !eventsTableAvailable) {
    return errorResult(
      "Production execution history tables are not available or not readable.",
      [
        sessionsResult.error?.message,
        eventsResult.error?.message,
      ]
        .filter(Boolean)
        .join(" | "),
    );
  }

  const rawSessions = sessionsTableAvailable
    ? ((sessionsResult.data ?? []) as RawSessionRow[])
    : [];
  const rawEvents = eventsTableAvailable
    ? ((eventsResult.data ?? []) as RawEventRow[])
    : [];

  const lineIds = uniqueStrings([
    ...rawSessions.map((row) => row.line_id),
    ...rawEvents.map((row) => row.line_id),
  ]);
  const contextIds = uniqueStrings([
    ...rawSessions.map((row) => row.context_id),
    ...rawEvents.map((row) => row.context_id),
  ]);
  const profileIds = uniqueStrings([
    ...rawSessions.map((row) => row.started_by),
    ...rawSessions.map((row) => row.ended_by),
    ...rawEvents.map((row) => row.event_by),
  ]);

  const [lineLookup, contextLookup, profileLookup] = await Promise.all([
    loadLineLookup(lineIds),
    loadContextLookup(contextIds),
    loadProfileLookup(profileIds),
  ]);

  const sessions = rawSessions.map((row) =>
    sessionFromRow(row, lineLookup, contextLookup, profileLookup),
  );
  const events = rawEvents.map((row) =>
    eventFromRow(row, lineLookup, profileLookup),
  );
  const latestEventAt = events
    .map((event) => event.eventAt)
    .filter((value): value is string => value !== null)
    .sort()
    .at(-1) ?? null;

  return success({
    summary: {
      totalSessions: sessions.length,
      activeSessions: sessions.filter((session) => session.endedAt === null)
        .length,
      closedSessions: sessions.filter((session) => session.endedAt !== null)
        .length,
      totalEvents: events.length,
      startEvents: events.filter(
        (event) => event.eventType === "START_PRODUCTION",
      ).length,
      latestEventAt,
      sessionsTableAvailable,
      eventsTableAvailable,
    },
    sessions,
    events,
    warnings: [
      "History is read-only. This page does not start, stop, close, or edit production sessions.",
      "The backend-only RPC test on T20 passed and was strict-cleaned, so zero stored sessions/events is expected.",
      "Frontend start remains locked until Prompt 5E-7 or later approval.",
    ],
  });
}

async function loadLineLookup(lineIds: string[]): Promise<LineLookup> {
  const client = ensureClient();

  if (!client || lineIds.length === 0) {
    return {};
  }

  const { data, error } = await client
    .from("production_lines")
    .select("id,line_code,group_id")
    .in("id", lineIds);

  if (error) {
    return {};
  }

  const lineRows = (data ?? []) as Array<{
    id?: string | null;
    line_code?: string | null;
    group_id?: string | null;
  }>;
  const groupIds = uniqueStrings(lineRows.map((row) => row.group_id));
  const groupLookup = await loadGroupLookup(groupIds);

  return Object.fromEntries(
    lineRows
      .map((row) => {
        const id = asString(row.id);

        if (!id) {
          return null;
        }

        return [
          id,
          {
            lineCode: asString(row.line_code),
            groupCode: row.group_id ? groupLookup[row.group_id] ?? null : null,
          },
        ] as const;
      })
      .filter((entry): entry is readonly [string, LineLookup[string]] => entry !== null),
  );
}

async function loadGroupLookup(groupIds: string[]): Promise<Record<string, string | null>> {
  const client = ensureClient();

  if (!client || groupIds.length === 0) {
    return {};
  }

  const { data, error } = await client
    .from("production_groups")
    .select("id,group_code")
    .in("id", groupIds);

  if (error) {
    return {};
  }

  return Object.fromEntries(
    ((data ?? []) as Array<{ id?: string | null; group_code?: string | null }>)
      .map((row) => {
        const id = asString(row.id);

        if (!id) {
          return null;
        }

        return [id, asString(row.group_code)] as const;
      })
      .filter((entry): entry is readonly [string, string | null] => entry !== null),
  );
}

async function loadContextLookup(contextIds: string[]): Promise<ContextLookup> {
  const client = ensureClient();

  if (!client || contextIds.length === 0) {
    return {};
  }

  const { data, error } = await client
    .from("line_order_contexts")
    .select("id,order_id,customer_id,style_code,color_name")
    .in("id", contextIds);

  if (error) {
    return {};
  }

  const contexts = (data ?? []) as Array<{
    id?: string | null;
    order_id?: string | null;
    customer_id?: string | null;
    style_code?: string | null;
    color_name?: string | null;
  }>;
  const orderIds = uniqueStrings(contexts.map((row) => row.order_id));
  const customerIds = uniqueStrings(contexts.map((row) => row.customer_id));
  const [orderLookup, customerLookup] = await Promise.all([
    loadOrderLookup(orderIds),
    loadCustomerLookup(customerIds),
  ]);

  return Object.fromEntries(
    contexts
      .map((row) => {
        const id = asString(row.id);

        if (!id) {
          return null;
        }

        const orderId = asString(row.order_id);
        const customerId = asString(row.customer_id);

        return [
          id,
          {
            orderId,
            orderCode: orderId ? orderLookup[orderId] ?? null : null,
            customerName: customerId ? customerLookup[customerId] ?? null : null,
            styleCode: asString(row.style_code),
            colorName: asString(row.color_name),
          },
        ] as const;
      })
      .filter((entry): entry is readonly [string, ContextLookup[string]] => entry !== null),
  );
}

async function loadOrderLookup(orderIds: string[]): Promise<Record<string, string | null>> {
  const client = ensureClient();

  if (!client || orderIds.length === 0) {
    return {};
  }

  const { data, error } = await client
    .from("orders")
    .select("id,order_code")
    .in("id", orderIds);

  if (error) {
    return {};
  }

  return Object.fromEntries(
    ((data ?? []) as Array<{ id?: string | null; order_code?: string | null }>)
      .map((row) => {
        const id = asString(row.id);

        if (!id) {
          return null;
        }

        return [id, asString(row.order_code)] as const;
      })
      .filter((entry): entry is readonly [string, string | null] => entry !== null),
  );
}

async function loadCustomerLookup(
  customerIds: string[],
): Promise<Record<string, string | null>> {
  const client = ensureClient();

  if (!client || customerIds.length === 0) {
    return {};
  }

  const { data, error } = await client
    .from("customers")
    .select("id,customer_name")
    .in("id", customerIds);

  if (error) {
    return {};
  }

  return Object.fromEntries(
    ((data ?? []) as Array<{ id?: string | null; customer_name?: string | null }>)
      .map((row) => {
        const id = asString(row.id);

        if (!id) {
          return null;
        }

        return [id, asString(row.customer_name)] as const;
      })
      .filter((entry): entry is readonly [string, string | null] => entry !== null),
  );
}

async function loadProfileLookup(profileIds: string[]): Promise<ProfileLookup> {
  const client = ensureClient();

  if (!client || profileIds.length === 0) {
    return {};
  }

  const { data, error } = await client
    .from("profiles")
    .select("id,full_name")
    .in("id", profileIds);

  if (error) {
    return {};
  }

  return Object.fromEntries(
    ((data ?? []) as Array<{ id?: string | null; full_name?: string | null }>)
      .map((row) => {
        const id = asString(row.id);

        if (!id) {
          return null;
        }

        return [id, asString(row.full_name)] as const;
      })
      .filter((entry): entry is readonly [string, string | null] => entry !== null),
  );
}

function sessionFromRow(
  row: RawSessionRow,
  lineLookup: LineLookup,
  contextLookup: ContextLookup,
  profileLookup: ProfileLookup,
): ProductionExecutionSessionReview {
  const lineId = asString(row.line_id);
  const contextId = asString(row.context_id);
  const startedBy = asString(row.started_by);
  const endedBy = asString(row.ended_by);
  const line = lineId ? lineLookup[lineId] : null;
  const context = contextId ? contextLookup[contextId] : null;

  return {
    id: asString(row.id) ?? "",
    lineId,
    lineCode: line?.lineCode ?? null,
    groupCode: line?.groupCode ?? null,
    contextId,
    orderId: asString(row.order_id) ?? context?.orderId ?? null,
    orderCode: context?.orderCode ?? null,
    customerName: context?.customerName ?? null,
    styleCode: context?.styleCode ?? null,
    colorName: context?.colorName ?? null,
    status: asString(row.status) ?? "UNKNOWN",
    startedAt: asString(row.started_at),
    startedBy,
    startedByName: startedBy ? profileLookup[startedBy] ?? null : null,
    startReason: asString(row.start_reason),
    endedAt: asString(row.ended_at),
    endedBy,
    endedByName: endedBy ? profileLookup[endedBy] ?? null : null,
    endReason: asString(row.end_reason),
  };
}

function eventFromRow(
  row: RawEventRow,
  lineLookup: LineLookup,
  profileLookup: ProfileLookup,
): ProductionExecutionEventReview {
  const lineId = asString(row.line_id);
  const eventBy = asString(row.event_by);
  const line = lineId ? lineLookup[lineId] : null;

  return {
    id: asString(row.id) ?? "",
    sessionId: asString(row.session_id),
    lineId,
    lineCode: line?.lineCode ?? null,
    contextId: asString(row.context_id),
    eventType: asString(row.event_type) ?? "UNKNOWN",
    fromStatus: asString(row.from_status),
    toStatus: asString(row.to_status) ?? "UNKNOWN",
    eventAt: asString(row.event_at),
    eventBy,
    eventByName: eventBy ? profileLookup[eventBy] ?? null : null,
    reason: asString(row.reason),
    metadata: row.metadata,
  };
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values.filter(
        (value): value is string => typeof value === "string" && value.length > 0,
      ),
    ),
  );
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

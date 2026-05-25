# Production Execution State Machine

This document defines the production execution foundation for Jade Textile ERP/MES V2.

Production execution is still controlled. The database foundation exists, but no frontend screen may start production, mark a line running, create downtime, create production entries, or invent feed values until the backend-only RPC test phase is approved.

## State Definitions

Operational `line_status` values:

| Status | Meaning |
| --- | --- |
| `WAITING_FOR_DATA` | Line has no execution feed yet. |
| `RUNNING` | Future real production session is active. |
| `STOPPED` | Future downtime/stop event is active. |
| `CHANGEOVER` | Future assignment or setup change workflow is active. |
| `QUALITY_HOLD` | Future quality hold is active. |
| `NO_FEEDING` | Future material/feed stop is active. |

Assignment status:

| Status | Meaning |
| --- | --- |
| `AVAILABLE` | Active standard line has no active context and can be assigned by planning. |
| `ASSIGNED` | Active `line_order_contexts` row is linked to the line. |
| `NOT_ASSIGNABLE` | Line is inactive, ghost, special, or otherwise protected. |

Execution readiness/status:

| Status | Meaning |
| --- | --- |
| `NOT_STARTED` | No active line-order context. |
| `WAITING_FOR_EXECUTION_DATA` | Assigned but blocked or not ready. |
| `READY_TO_START` | View-derived readiness only; Start Production remains disabled. |
| `RUNNING` | Future active execution session. |
| `PAUSED_STOPPED` | Future downtime stop. |
| `QUALITY_HOLD` | Future quality hold. |
| `NO_FEEDING` | Future feed/material stop. |
| `COMPLETED_OR_CLOSED` | Future closed execution or context. |

## Allowed Transitions

| From | To | Future action | Requirements |
| --- | --- | --- | --- |
| `ASSIGNED` + `WAITING_FOR_DATA` | `READY_TO_START` | Derived readiness | Active context exists and line is eligible. |
| `READY_TO_START` | `RUNNING` | Start production | ADMIN, MANAGER, PRODUCTION, or SUPERVISOR; active context; active non-special line; no active session. |
| `RUNNING` | `STOPPED` | Register downtime | Real downtime event required. |
| `STOPPED` | `RUNNING` | Resolve downtime | Real downtime resolution required. |
| `RUNNING` | `QUALITY_HOLD` | Quality hold | Real quality hold event required. |
| `QUALITY_HOLD` | `RUNNING` | Quality release | Real quality release required. |
| `RUNNING` | `NO_FEEDING` | Feeding/material stop | Real feeding/material event required. |
| `NO_FEEDING` | `RUNNING` | Feed restored | Real feed restoration required. |
| `ASSIGNED` or `RUNNING` | `CHANGEOVER` | Change assignment/changeover | Controlled change workflow required. |
| `ASSIGNED` | `CLOSED` | Close context | Historical context must remain, never delete. |

## Blocked Transitions

- Available lines cannot start production.
- Ghost, inactive, or special lines cannot start production.
- Lines without active contexts cannot start production.
- Starting production must not create fake `feed_percent`.
- Starting production must not create fake `feed_cover_days`.
- Starting production must not create fake `actual_today`.
- Starting production must not fake `target_today`; target must come from real planning.
- Direct overwrite of an active line context remains blocked.
- Multiple active production sessions per line are blocked.
- Multiple active downtime events per line are blocked in the future downtime workflow.

## Tables

Migration 012 created:

- `production_execution_sessions`: one active production execution session per line/context after production is started.
- `production_execution_events`: mandatory append-only state transition log.

`production_execution_sessions` includes line/context/order references, start/end timestamps, profile references, reasons, constrained statuses, unique active session per line, unique active session per context, and indexes.

`production_execution_events` includes session/line/context references, event type, from/to status, event user, reason, metadata, and indexes.

## Readiness View

`public.production_execution_readiness_view` is read-only and uses `security_invoker = true`.

It returns line, group, context, order, customer, style, color, shipment, current operational line status, assignment status, execution readiness status, blockers, feed fields, actual/target today, and last refreshed timestamp.

Readiness logic:

- `ASSIGNED` when an active line context exists.
- `AVAILABLE` when a standard active line has no context and belongs to an active non-ghost group that is not `G-11`.
- `NOT_ASSIGNABLE` otherwise.
- `READY_TO_START` only when the line is assigned, active, standard, in an active non-ghost group, still `WAITING_FOR_DATA`, and has no active production execution session.
- `RUNNING`, `PAUSED_STOPPED`, `QUALITY_HOLD`, and `NO_FEEDING` mirror real operational line state.
- `NOT_STARTED` applies when no active context exists.
- `WAITING_FOR_EXECUTION_DATA` covers assigned but blocked lines.

Downtime blockers are intentionally TODO until a real downtime workflow/table exists.

## Production Execution UI Source

The Production Execution page now reads from `public.production_execution_readiness_view` as the primary source of truth.

- `READY_TO_START` is view-derived readiness only. It does not mean the line is `RUNNING`.
- Frontend Start Production remains disabled.
- The `start_production_execution` RPC exists in the database but is not called by the frontend yet.
- The page displays readiness view, sessions table, and events table availability, plus current sessions/events counts.
- Applying migration 012 and reading the view does not create sessions, events, feed values, actuals, targets, downtime, or production entries.

## RPC Design

Future RPC:

```sql
public.start_production_execution(
  p_line_id uuid,
  p_context_id uuid,
  p_reason text default 'Start production'
)
```

The RPC requires authenticated user, active profile, role in `ADMIN`, `MANAGER`, `PRODUCTION`, or `SUPERVISOR`, active non-special line, active non-ghost group not `G-11`, matching active context, no active session for line/context, and current `line_status = WAITING_FOR_DATA`.

Concurrency safety:

- the RPC locks `line_current_state` for the selected line before validating `current_context_id` and `line_status`
- this prevents two users from starting the same line at the same time

The RPC inserts `production_execution_sessions`, inserts `production_execution_events`, updates `line_current_state.line_status` to `RUNNING`, optionally writes compatible `audit_logs`, and leaves `feed_percent`, `feed_cover_days`, `actual_today`, and `target_today` untouched.

The frontend does not call this RPC yet.

## Backend-Only RPC Test Plan

Prompt 5E-5 prepares a manual backend-only test plan for `public.start_production_execution`.

- Test plan: `docs/PRODUCTION_EXECUTION_RPC_TEST_PLAN.md`
- Manual SQL test script: `supabase/manual/003_backend_only_start_production_rpc_test.sql`
- Manual rollback script: `supabase/manual/004_backend_only_start_production_rpc_test_rollback.sql`

Do not run the RPC until the selected line is approved and rollback SQL is prepared. Prefer a non-critical test line if H8 should not be touched.

## RLS Design

- authenticated users can `SELECT` production execution sessions/events
- authenticated users can `SELECT` the readiness view
- direct frontend `INSERT`, `UPDATE`, and `DELETE` policies are not created
- future writes should use controlled RPC functions
- existing `line_order_contexts` and `line_current_state` policies are not weakened

## Apply Safety

Applying migration 012 created schema only. It did not start production, mark H8 or any line `RUNNING`, insert sessions/events, update `line_current_state`, or update feed/actual/target fields.

## Next Safety Step

Prompt 5E-6 should choose a test line and run the backend-only RPC test manually with rollback prepared. Do not enable frontend Start Production yet.

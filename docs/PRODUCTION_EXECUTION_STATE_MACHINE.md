# Production Execution State Machine

This document defines the review-only production execution foundation for Jade Textile ERP/MES V2.

Production execution is not enabled yet. No screen may start production, mark a line running, create downtime, create production entries, or invent feed values until the migration/RPC is reviewed, applied, and tested.

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
| `AVAILABLE` | Real active line has no active context and can be assigned by planning. |
| `ASSIGNED` | Real active `line_order_contexts` row is linked to the line. |
| `NOT_ASSIGNABLE` | Line is inactive, ghost, special, or otherwise protected. |

Execution readiness/status:

| Status | Meaning |
| --- | --- |
| `NOT_STARTED` | No active line-order context. |
| `WAITING_FOR_EXECUTION_DATA` | Assigned but blocked or not ready. |
| `READY_TO_START` | Derived readiness only; start button remains disabled. |
| `RUNNING` | Future active execution session. |
| `PAUSED_STOPPED` | Future downtime stop. |
| `QUALITY_HOLD` | Future quality hold. |
| `NO_FEEDING` | Future feed/material stop. |
| `COMPLETED_OR_CLOSED` | Future closed execution or context. |

## Allowed Transitions

| From | To | Future action | Requirements |
| --- | --- | --- | --- |
| `ASSIGNED` + `WAITING_FOR_DATA` | `READY_TO_START` | Derived UI state | Active context exists and line is eligible. |
| `READY_TO_START` | `RUNNING` | Start production | ADMIN, MANAGER, PRODUCTION, or SUPERVISOR; active context; active non-special line; no active downtime/session. |
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

Review-only migration:

`supabase/migrations/012_production_execution_state_machine_foundation.sql`

Tables proposed:

- `production_execution_sessions`: one active production execution session per line/context after production is started.
- `production_execution_events`: append-only state transition log.

`production_execution_sessions` includes:

- line/context/order references
- start/end timestamps and users
- start/end reasons
- constrained status values: `RUNNING`, `PAUSED_STOPPED`, `QUALITY_HOLD`, `NO_FEEDING`, `CLOSED`
- unique active session per line
- unique active session per context
- indexes on line, context, order, and start time

`production_execution_events` includes:

- session/line/context references
- event type
- from/to status
- event user and reason
- metadata JSON
- indexes on line/event time, context/event time, and session

## Readiness View

The proposed `production_execution_readiness_view` is read-only and uses `security_invoker = true`.

It returns:

- line, group, context, order, customer, style, color, and shipment fields
- current operational line status
- assignment status
- execution readiness status
- readiness blockers
- feed percent and feed cover days
- actual/target today
- last refreshed timestamp

Readiness logic:

- `ASSIGNED` when an active line context exists.
- `AVAILABLE` when a standard active line has no context and belongs to an active non-ghost group that is not `G-11`.
- `NOT_ASSIGNABLE` otherwise.
- `READY_TO_START` only when the line is assigned, active, standard, in an active non-ghost group, still `WAITING_FOR_DATA`, and has no active production execution session.
- `RUNNING`, `PAUSED_STOPPED`, `QUALITY_HOLD`, and `NO_FEEDING` mirror real operational line state.
- `NOT_STARTED` applies when no active context exists.
- `WAITING_FOR_EXECUTION_DATA` covers assigned but blocked lines.

Readiness blockers include:

- No active context
- Inactive line
- Special line
- Ghost or inactive line group
- Operational status is X
- Already running

Downtime blockers are intentionally left as a TODO until a real downtime workflow/table exists.

## RPC Design

Future RPC:

```sql
public.start_production_execution(
  p_line_id uuid,
  p_context_id uuid,
  p_reason text default 'Start production'
)
```

The RPC requires:

- authenticated user
- active profile
- role in `ADMIN`, `MANAGER`, `PRODUCTION`, `SUPERVISOR`
- line exists and is active
- line is not special
- group is active and not ghost
- group code is not `G-11`
- current line context matches `p_context_id`
- active context belongs to line
- no active production execution session exists for the line
- no active production execution session exists for the context
- current `line_status = WAITING_FOR_DATA`

The RPC is designed to:

- insert `production_execution_sessions`
- insert `production_execution_events`
- update `line_current_state.line_status` to `RUNNING`
- write `audit_logs` if the table exists
- leave `feed_percent` unchanged
- leave `feed_cover_days` unchanged
- leave `actual_today` unchanged
- leave `target_today` unchanged unless future planning logic provides a real target

The frontend does not call this RPC yet.

## RLS Design

Review-only RLS plan:

- authenticated users can `SELECT` production execution sessions/events
- authenticated users can `SELECT` the readiness view
- direct frontend `INSERT`, `UPDATE`, and `DELETE` policies are not created
- future writes should use controlled RPC functions
- existing `line_order_contexts` and `line_current_state` policies are not weakened

## Manual Review Checklist

Before applying migration 012:

- Confirm `profiles.id` references Supabase auth users.
- Confirm `profiles.role` values include `ADMIN`, `MANAGER`, `PRODUCTION`, and `SUPERVISOR`.
- Confirm `line_current_state` has `last_event_at`, `last_refreshed_at`, and `updated_at`.
- Confirm `audit_logs` has `table_name`, `record_id`, `action`, `old_data`, `new_data`, `changed_by`, `changed_at`, and `reason`.
- Review `security definer` function placement and fixed `search_path`.
- Confirm no direct write policies are created for the new tables.
- Apply first in a non-production or manually controlled review window if available.
- After apply, run a read-only query against `production_execution_readiness_view`.
- Confirm H8 appears as `READY_TO_START`.
- Confirm no rows exist in `production_execution_sessions` or `production_execution_events`.
- Do not enable frontend start buttons until the readiness view is verified.

## Rollback Plan

If migration 012 is applied and must be rolled back before any production execution data exists:

```sql
drop function if exists public.start_production_execution(uuid, uuid, text);
drop view if exists public.production_execution_readiness_view;
drop table if exists public.production_execution_events;
drop table if exists public.production_execution_sessions;
```

If any production execution data exists, do not drop tables blindly. Export/review the rows first and decide whether to close sessions, preserve audit history, or create a corrective migration.

## Safety Rules

Starting production is separate from feed and hourly production entry.

Production start means the line begins an execution session. It does not prove output quantity, feed coverage, operator count, downtime, or hourly target. Those values must come from later real workflows:

- hourly production entries
- material/feed readiness signals
- downtime events
- quality holds/releases
- real planning targets

This separation prevents the UI from creating fake operational confidence.

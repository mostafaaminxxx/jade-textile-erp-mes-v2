# Production Execution RPC Test Plan

## Purpose

This plan is for a backend-only controlled test of `public.start_production_execution`.

The test should prove that the RPC:

- creates exactly one `production_execution_sessions` row
- creates exactly one `START_PRODUCTION` row in `production_execution_events`
- changes the selected line from `WAITING_FOR_DATA` to `RUNNING`
- does not create fake `feed_percent`
- does not create fake `feed_cover_days`
- does not create fake `actual_today`
- does not create fake `target_today`
- keeps the frontend Start Production button disabled

## Critical Warning

Do not test on a real running production line without manager approval.

H8 is currently assigned and ready, but executing the RPC on H8 will temporarily change H8 to `RUNNING`. If H8 should not be touched, create a separate safe controlled assignment on another line first.

Recommended safer option: choose a non-critical available test line, assign a real order/context, then test on that line.

## Pre-Test Checklist

| Check | Required result |
| --- | --- |
| User profile | Active `ADMIN`, `MANAGER`, `PRODUCTION`, or `SUPERVISOR` |
| Selected line | Has active `line_order_context` |
| Selected line status | `WAITING_FOR_DATA` |
| Readiness view | `READY_TO_START` |
| Active session count for line | `0` |
| Event count for context | `0` before first test |
| Rollback SQL | Prepared before calling RPC |
| Frontend Start Production | Still disabled |

## Test Steps Summary

1. Capture baseline SQL.
2. Confirm safety stop query returns no blockers.
3. Call `public.start_production_execution` exactly once from Supabase SQL Editor.
4. Record the returned `session_id`.
5. Verify one session row exists.
6. Verify one `START_PRODUCTION` event row exists.
7. Verify selected line status became `RUNNING`.
8. Verify `feed_percent`, `feed_cover_days`, `actual_today`, and `target_today` are unchanged.
9. Verify readiness view now shows `RUNNING`.
10. Roll back immediately if this is only a controlled technical test.
11. Verify rollback restores `WAITING_FOR_DATA` and handles execution data according to the chosen rollback style.

## Rollback Strategy

### Option A: Strict Cleanup Rollback For Test-Only Data

Use only when management confirms this was a technical test and the execution rows should not remain as production history.

This rollback:

- deletes the test event row
- deletes the test session row
- sets `line_current_state.line_status` back to `WAITING_FOR_DATA`
- restores `last_event_at` only according to the recorded baseline
- keeps `current_context_id` unchanged
- does not touch `feed_percent`, `feed_cover_days`, `actual_today`, or `target_today`

Option A is recommended only for the first technical test if management confirms the test is not production history.

### Option B: Audit-Preserving Rollback

Use for real production usage or when the test should remain visible in execution history.

This rollback:

- keeps session and event rows
- sets the session to `CLOSED`
- sets `ended_at`, `ended_by`, and `end_reason`
- inserts a `CLOSE_SESSION` event
- sets `line_current_state.line_status` back to `WAITING_FOR_DATA`
- does not touch `feed_percent`, `feed_cover_days`, `actual_today`, or `target_today`

Option B is recommended for real production usage.

## Files

- Manual test script: `supabase/manual/003_backend_only_start_production_rpc_test.sql`
- Manual rollback script: `supabase/manual/004_backend_only_start_production_rpc_test_rollback.sql`

## Current H8 Reference

Use H8 only if approved:

- line code: `H8`
- group: `G-1`
- context id: `a287ba5b-3e97-469a-ba41-d2e64e99f285`
- current operational status: `WAITING_FOR_DATA`
- current readiness: `READY_TO_START`
- feed percent: `null`
- feed cover days: `null`

The frontend remains disconnected from `start_production_execution`.

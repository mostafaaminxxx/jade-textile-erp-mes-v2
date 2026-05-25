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

## Prompt 5E-6 Test Result

Controlled backend-only RPC technical test was completed on T20, not H8.

Selected line:

- line code: `T20`
- group: `G-1`
- line id: `fe5e280a-e52d-4928-8662-50f5621d216b`

Selected order/context:

- order id: `d210f483-ed3f-46b4-a531-44c26fa8ee67`
- order code: `YSEXH2785-FW26 P05-XH2785-FW26-UCI NOIR/URBAIN-BLANC==YESIM`
- customer: `LACOSTE`
- style: `XH2785`
- color: `UCI NOIR/URBAIN-BLANC`
- shipment date: `2026-04-12`
- T20 context id: `2bba0ea0-91cc-4d45-a304-a9f9747febab`

RPC result:

- RPC called once on T20 only.
- session id: `07c7d04c-7a73-4158-8d63-a09bbdc04fdb`
- event id: `29a98c2e-3821-4f29-b5d0-89907038679f`
- T20 changed from `WAITING_FOR_DATA` to `RUNNING`.
- One `START_PRODUCTION` event was created with `from_status = WAITING_FOR_DATA` and `to_status = RUNNING`.
- `feed_percent`, `feed_cover_days`, `actual_today`, and `target_today` remained unchanged.

Rollback:

- Option A strict cleanup rollback was executed immediately.
- Test event row was deleted.
- Test session row was deleted.
- T20 `line_status` was restored to `WAITING_FOR_DATA`.
- T20 `current_context_id` was kept as `2bba0ea0-91cc-4d45-a304-a9f9747febab`.
- T20 remains assigned and `READY_TO_START` for future controlled tests.

Final state:

- `production_execution_sessions` count: `0`
- `production_execution_events` count: `0`
- active line contexts: `2`
- feed rows: `0`
- H8 remains `WAITING_FOR_DATA` and `READY_TO_START`
- T20 remains `WAITING_FOR_DATA` and `READY_TO_START`
- frontend Start Production remains disabled

## Prompt 5F History UI Expectation

Prompt 5F adds a read-only Production Session Review and Execution History UI.

The Vercel build hardening patch keeps this section as a simple read-only placeholder using readiness/schema counts. Full stored session/event cards should be reintroduced only after deployment stability is confirmed.

Because Prompt 5E-6 used Option A strict cleanup rollback, the history UI should show:

- `production_execution_sessions = 0`
- `production_execution_events = 0`
- no stored session cards
- no stored event timeline rows

That is correct and not a failure. The T20 technical test evidence is preserved in this document and in `docs/NEXT_STEPS.md`; the database execution history was intentionally cleaned for the test-only rollback.

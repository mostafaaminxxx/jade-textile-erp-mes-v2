# Production Execution State Machine

This is a review-only foundation for Jade Textile ERP/MES V2.

Production execution is not enabled yet. The app must not start production, mark any line RUNNING, create downtime, create production entries, or invent feed values until the migration/RPC is reviewed, applied, and tested.

## Status separation

Operational status comes from `line_current_state.line_status`.

Assignment status comes from whether a real active `line_order_contexts` row exists.

Execution readiness is derived in the UI for review only.

## Current allowed readiness

A line is derived as `READY_TO_START` only when:
- it has an active context
- the line is active
- the line is not special
- group is not G-11
- line status is `WAITING_FOR_DATA`

The Start Production button remains disabled.

## Guardrails

Starting production must not create fake:
- `feed_percent`
- `feed_cover_days`
- `actual_today`
- `target_today`
- downtime
- production entries

Assignment does not start production.

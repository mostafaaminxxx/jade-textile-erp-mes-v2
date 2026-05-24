-- REVIEW ONLY.
-- DO NOT APPLY UNTIL MANUALLY APPROVED.
-- Production execution state machine foundation.
-- Does not seed data.
-- Does not start production.
-- Does not change existing line status.
-- Does not create fake feed values.

-- Future planned tables:
-- public.production_execution_sessions
-- public.production_execution_events
-- public.production_execution_readiness_view

-- Future planned RPC:
-- public.start_production_execution(p_line_id uuid, p_context_id uuid, p_reason text)

-- Required safety rules:
-- 1. Auth required.
-- 2. Active profile required.
-- 3. Role required: ADMIN, MANAGER, PRODUCTION, SUPERVISOR.
-- 4. Active non-special line required.
-- 5. Active line_order_context required.
-- 6. line_current_state.current_context_id must match context id.
-- 7. line_status must be WAITING_FOR_DATA before start.
-- 8. No fake feed_percent, feed_cover_days, actual_today, or target_today.
-- 9. No direct frontend write policies.
-- 10. Writes must be through controlled RPC after approval.

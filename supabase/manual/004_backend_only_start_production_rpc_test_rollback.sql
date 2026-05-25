-- Rollback templates for backend-only start production RPC test.
-- Manual only. Do not run from frontend code.
-- Replace placeholders and review with management before executing.

-- Placeholders:
-- REPLACE_WITH_SESSION_ID
-- REPLACE_WITH_LINE_ID
-- REPLACE_WITH_CONTEXT_ID
-- REPLACE_WITH_USER_ID
-- REPLACE_WITH_PREVIOUS_LAST_EVENT_AT_OR_NULL

-- ==================================================
-- Option A: strict cleanup rollback for test-only data
-- ==================================================
-- Use only if management confirms this was test-only data and should not remain
-- in production execution history.
-- This does not touch feed_percent, feed_cover_days, actual_today, or target_today.

begin;

delete from public.production_execution_events
where session_id = 'REPLACE_WITH_SESSION_ID';

delete from public.production_execution_sessions
where id = 'REPLACE_WITH_SESSION_ID'
  and line_id = 'REPLACE_WITH_LINE_ID'
  and context_id = 'REPLACE_WITH_CONTEXT_ID';

update public.line_current_state
set
  line_status = 'WAITING_FOR_DATA',
  current_context_id = 'REPLACE_WITH_CONTEXT_ID',
  -- Replace this line manually:
  -- If baseline last_event_at was null, use: last_event_at = null
  -- If baseline last_event_at had a value, use: last_event_at = 'REPLACE_WITH_PREVIOUS_LAST_EVENT_AT_OR_NULL'::timestamptz
  last_event_at = null,
  last_refreshed_at = now(),
  updated_at = now()
where line_id = 'REPLACE_WITH_LINE_ID'
  and current_context_id = 'REPLACE_WITH_CONTEXT_ID';

commit;

-- ==================================================
-- Option B: audit-preserving rollback
-- ==================================================
-- Use for real production usage or when test history should remain visible.
-- This keeps session/event rows, closes the session, and writes CLOSE_SESSION.
-- This does not touch feed_percent, feed_cover_days, actual_today, or target_today.

-- begin;
--
-- update public.production_execution_sessions
-- set
--   status = 'CLOSED',
--   ended_at = now(),
--   ended_by = 'REPLACE_WITH_USER_ID',
--   end_reason = 'Rollback controlled backend-only test',
--   updated_at = now()
-- where id = 'REPLACE_WITH_SESSION_ID'
--   and line_id = 'REPLACE_WITH_LINE_ID'
--   and context_id = 'REPLACE_WITH_CONTEXT_ID'
--   and ended_at is null;
--
-- insert into public.production_execution_events (
--   session_id,
--   line_id,
--   context_id,
--   event_type,
--   from_status,
--   to_status,
--   event_by,
--   reason,
--   metadata
-- )
-- values (
--   'REPLACE_WITH_SESSION_ID',
--   'REPLACE_WITH_LINE_ID',
--   'REPLACE_WITH_CONTEXT_ID',
--   'CLOSE_SESSION',
--   'RUNNING',
--   'CLOSED',
--   'REPLACE_WITH_USER_ID',
--   'Rollback controlled backend-only test',
--   jsonb_build_object('rollback_type', 'audit_preserving')
-- );
--
-- update public.line_current_state
-- set
--   line_status = 'WAITING_FOR_DATA',
--   current_context_id = 'REPLACE_WITH_CONTEXT_ID',
--   last_refreshed_at = now(),
--   updated_at = now()
-- where line_id = 'REPLACE_WITH_LINE_ID'
--   and current_context_id = 'REPLACE_WITH_CONTEXT_ID';
--
-- commit;

-- ==================================================
-- Post-rollback verification
-- ==================================================

select
  line_id,
  current_context_id,
  line_status,
  feed_percent,
  feed_cover_days,
  actual_today,
  target_today,
  last_event_at,
  last_refreshed_at,
  updated_at
from public.line_current_state
where line_id = 'REPLACE_WITH_LINE_ID';

select
  id,
  line_id,
  context_id,
  status,
  started_at,
  ended_at,
  ended_by,
  end_reason
from public.production_execution_sessions
where id = 'REPLACE_WITH_SESSION_ID';

select count(*)::int as events_for_session
from public.production_execution_events
where session_id = 'REPLACE_WITH_SESSION_ID';

select
  line_code,
  current_context_id,
  context_id,
  line_status,
  assignment_status,
  execution_readiness_status,
  readiness_blockers,
  feed_percent,
  feed_cover_days,
  actual_today,
  target_today
from public.production_execution_readiness_view
where context_id = 'REPLACE_WITH_CONTEXT_ID';

select count(*)::int as line_current_state_with_feed_percent
from public.line_current_state
where feed_percent is not null;

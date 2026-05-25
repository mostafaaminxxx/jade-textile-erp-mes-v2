-- Backend-only controlled test for public.start_production_execution.
-- DO NOT RUN until management approves the selected line.
-- DO NOT use this from frontend code.
-- This script is manual only and must be run from Supabase SQL Editor by an approved operator.

-- Replace these before running manually:
-- SELECTED_LINE_CODE = 'H8'
-- SELECTED_CONTEXT_ID = 'a287ba5b-3e97-469a-ba41-d2e64e99f285'
-- TEST_REASON = 'Controlled backend-only production start test'

-- ==================================================
-- 1. Baseline check
-- ==================================================

with selected_line as (
  select
    pl.id as line_id,
    pl.line_code
  from public.production_lines pl
  where pl.line_code = 'H8'
)
select
  sl.line_id,
  sl.line_code,
  lcs.current_context_id,
  'a287ba5b-3e97-469a-ba41-d2e64e99f285'::uuid as selected_context_id,
  lcs.line_status,
  lcs.feed_percent,
  lcs.feed_cover_days,
  lcs.actual_today,
  lcs.target_today,
  lcs.last_event_at,
  lcs.last_refreshed_at
from selected_line sl
join public.line_current_state lcs
  on lcs.line_id = sl.line_id;

select
  line_id,
  line_code,
  group_code,
  current_context_id,
  context_id,
  order_code,
  customer_name,
  style_code,
  color_name,
  shipment_date,
  line_status,
  assignment_status,
  execution_readiness_status,
  readiness_blockers,
  feed_percent,
  feed_cover_days,
  actual_today,
  target_today,
  last_refreshed_at
from public.production_execution_readiness_view
where line_code = 'H8';

with selected_line as (
  select id as line_id
  from public.production_lines
  where line_code = 'H8'
)
select
  count(*)::int as active_sessions_for_selected_line_or_context_before
from public.production_execution_sessions pes
join selected_line sl
  on sl.line_id = pes.line_id
where pes.ended_at is null
   or (
    pes.context_id = 'a287ba5b-3e97-469a-ba41-d2e64e99f285'::uuid
    and pes.ended_at is null
  );

with selected_line as (
  select id as line_id
  from public.production_lines
  where line_code = 'H8'
)
select
  count(*)::int as events_for_selected_line_or_context_before
from public.production_execution_events pee
join selected_line sl
  on sl.line_id = pee.line_id
where pee.context_id = 'a287ba5b-3e97-469a-ba41-d2e64e99f285'::uuid
   or pee.line_id = sl.line_id;

-- ==================================================
-- 2. Safety stop query
-- ==================================================
-- This query must return zero rows before the RPC call.
-- If it returns any row, STOP and do not call the RPC.

with selected_readiness as (
  select *
  from public.production_execution_readiness_view
  where line_code = 'H8'
),
selected_line as (
  select id as line_id
  from public.production_lines
  where line_code = 'H8'
),
checks as (
  select
    case
      when not exists (select 1 from selected_readiness)
        then 'Selected line is missing from readiness view'
      when exists (
        select 1 from selected_readiness
        where execution_readiness_status <> 'READY_TO_START'
      )
        then 'Line is not READY_TO_START'
    end as blocker
  union all
  select 'Line status is not WAITING_FOR_DATA'
  where exists (
    select 1
    from selected_readiness
    where line_status::text <> 'WAITING_FOR_DATA'
  )
  union all
  select 'Selected context does not match current line context'
  where exists (
    select 1
    from selected_readiness
    where current_context_id is distinct from 'a287ba5b-3e97-469a-ba41-d2e64e99f285'::uuid
       or context_id is distinct from 'a287ba5b-3e97-469a-ba41-d2e64e99f285'::uuid
  )
  union all
  select 'Active production execution session already exists'
  where exists (
    select 1
    from public.production_execution_sessions pes
    join selected_line sl
      on sl.line_id = pes.line_id
    where pes.ended_at is null
       or (
        pes.context_id = 'a287ba5b-3e97-469a-ba41-d2e64e99f285'::uuid
        and pes.ended_at is null
      )
  )
  union all
  select 'Readiness blockers are not empty'
  where exists (
    select 1
    from selected_readiness
    where cardinality(readiness_blockers) > 0
  )
)
select blocker
from checks
where blocker is not null;

-- ==================================================
-- 3. RPC call
-- ==================================================
-- DO NOT UNCOMMENT UNTIL BASELINE IS VERIFIED.
-- Record the returned session_id immediately.

-- select public.start_production_execution(
--   p_line_id := 'REPLACE_WITH_LINE_ID',
--   p_context_id := 'REPLACE_WITH_CONTEXT_ID',
--   p_reason := 'Controlled backend-only production start test'
-- ) as session_id;

-- ==================================================
-- 4. Post-RPC verification
-- ==================================================
-- Replace REPLACE_WITH_SESSION_ID after the RPC returns it.

select
  id,
  line_id,
  context_id,
  order_id,
  started_at,
  started_by,
  start_reason,
  ended_at,
  status,
  created_at,
  updated_at
from public.production_execution_sessions
where id = 'REPLACE_WITH_SESSION_ID';

select
  id,
  session_id,
  line_id,
  context_id,
  event_type,
  from_status,
  to_status,
  event_at,
  event_by,
  reason,
  metadata,
  created_at
from public.production_execution_events
where session_id = 'REPLACE_WITH_SESSION_ID'
order by event_at asc;

with selected_line as (
  select id as line_id
  from public.production_lines
  where line_code = 'H8'
)
select
  lcs.line_id,
  lcs.current_context_id,
  lcs.line_status,
  lcs.feed_percent,
  lcs.feed_cover_days,
  lcs.actual_today,
  lcs.target_today,
  lcs.last_event_at,
  lcs.last_refreshed_at,
  lcs.updated_at
from public.line_current_state lcs
join selected_line sl
  on sl.line_id = lcs.line_id;

select
  line_code,
  group_code,
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
where line_code = 'H8';

select count(*)::int as line_current_state_with_feed_percent
from public.line_current_state
where feed_percent is not null;

-- ==================================================
-- 5. Expected result after RPC
-- ==================================================
-- - one production_execution_sessions row exists for REPLACE_WITH_SESSION_ID
-- - one START_PRODUCTION event exists for REPLACE_WITH_SESSION_ID
-- - selected line status is RUNNING
-- - readiness view shows RUNNING
-- - feed_percent is unchanged/null
-- - feed_cover_days is unchanged/null
-- - actual_today is unchanged
-- - target_today is unchanged
-- - frontend Start Production remains disabled

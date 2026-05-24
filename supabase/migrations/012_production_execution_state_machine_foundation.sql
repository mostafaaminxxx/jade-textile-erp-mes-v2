-- REVIEW ONLY.
-- DO NOT APPLY UNTIL MANUALLY APPROVED.
-- Defines production execution state machine foundation.
-- Does not seed data.
-- Does not start production.
-- Does not change existing line status.
-- Does not create fake feed values.
-- Frontend writes remain disabled.
--
-- Safety model:
-- - Assigning a line-order context does not start production.
-- - Starting production, when later approved, creates a real execution session.
-- - Starting production must not invent feed_percent, feed_cover_days, actual_today, or target_today.
-- - Direct frontend INSERT/UPDATE/DELETE policies are intentionally not created.

create table if not exists public.production_execution_sessions (
  id uuid primary key default gen_random_uuid(),
  line_id uuid not null references public.production_lines(id),
  context_id uuid not null references public.line_order_contexts(id),
  order_id uuid references public.orders(id),
  started_at timestamptz not null default now(),
  started_by uuid references public.profiles(id),
  start_reason text,
  ended_at timestamptz,
  ended_by uuid references public.profiles(id),
  end_reason text,
  status text not null default 'RUNNING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint production_execution_sessions_status_check check (
    status in (
      'RUNNING',
      'PAUSED_STOPPED',
      'QUALITY_HOLD',
      'NO_FEEDING',
      'CLOSED'
    )
  )
);

create unique index if not exists production_execution_sessions_one_active_line_idx
on public.production_execution_sessions(line_id)
where ended_at is null;

create unique index if not exists production_execution_sessions_one_active_context_idx
on public.production_execution_sessions(context_id)
where ended_at is null;

create index if not exists production_execution_sessions_line_id_idx
on public.production_execution_sessions(line_id);

create index if not exists production_execution_sessions_context_id_idx
on public.production_execution_sessions(context_id);

create index if not exists production_execution_sessions_order_id_idx
on public.production_execution_sessions(order_id);

create index if not exists production_execution_sessions_started_at_idx
on public.production_execution_sessions(started_at desc);

create table if not exists public.production_execution_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.production_execution_sessions(id),
  line_id uuid not null references public.production_lines(id),
  context_id uuid references public.line_order_contexts(id),
  event_type text not null,
  from_status text,
  to_status text not null,
  event_at timestamptz not null default now(),
  event_by uuid references public.profiles(id),
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint production_execution_events_type_check check (
    event_type in (
      'START_PRODUCTION',
      'STOP_FOR_DOWNTIME',
      'RESUME_AFTER_DOWNTIME',
      'QUALITY_HOLD',
      'QUALITY_RELEASE',
      'NO_FEEDING',
      'FEED_RESTORED',
      'CLOSE_SESSION'
    )
  )
);

create index if not exists production_execution_events_line_event_at_idx
on public.production_execution_events(line_id, event_at desc);

create index if not exists production_execution_events_context_event_at_idx
on public.production_execution_events(context_id, event_at desc);

create index if not exists production_execution_events_session_id_idx
on public.production_execution_events(session_id);

-- TODO: When a real downtime_events table/workflow exists, add a safe active-downtime
-- blocker to this view and the start_production_execution RPC. This migration does
-- not depend on downtime tables because they are not active in the current phase.
create or replace view public.production_execution_readiness_view
with (security_invoker = true)
as
with readiness as (
  select
    pl.id as line_id,
    pl.line_code,
    pl.group_id,
    pg.group_code,
    pg.group_name,
    lcs.current_context_id,
    loc.id as context_id,
    loc.order_id,
    o.order_code,
    loc.customer_id,
    c.customer_name,
    loc.style_code,
    loc.color_name,
    loc.shipment_date,
    lcs.line_status,
    case
      when loc.id is not null then 'ASSIGNED'
      when pl.is_active = true
        and coalesce(pl.is_special, false) = false
        and coalesce(pg.is_active, false) = true
        and coalesce(pg.is_ghost, false) = false
        and pg.group_code <> 'G-11'
        then 'AVAILABLE'
      else 'NOT_ASSIGNABLE'
    end as assignment_status,
    case
      when lcs.line_status::text = 'RUNNING' then 'RUNNING'
      when lcs.line_status::text = 'STOPPED' then 'PAUSED_STOPPED'
      when lcs.line_status::text = 'QUALITY_HOLD' then 'QUALITY_HOLD'
      when lcs.line_status::text = 'NO_FEEDING' then 'NO_FEEDING'
      when loc.id is null then 'NOT_STARTED'
      when pl.is_active = true
        and coalesce(pl.is_special, false) = false
        and coalesce(pg.is_active, false) = true
        and coalesce(pg.is_ghost, false) = false
        and pg.group_code <> 'G-11'
        and lcs.current_context_id is not null
        and loc.is_active = true
        and lcs.line_status::text = 'WAITING_FOR_DATA'
        and pes.id is null
        then 'READY_TO_START'
      else 'WAITING_FOR_EXECUTION_DATA'
    end as execution_readiness_status,
    array_remove(array[
      case when loc.id is null then 'No active context' end,
      case when pl.is_active is not true then 'Inactive line' end,
      case when coalesce(pl.is_special, false) = true then 'Special line' end,
      case
        when coalesce(pg.is_active, false) is not true
          or coalesce(pg.is_ghost, false) = true
          or pg.group_code = 'G-11'
          then 'Ghost or inactive line group'
      end,
      case
        when loc.id is not null and lcs.line_status::text <> 'WAITING_FOR_DATA'
          then 'Operational status is ' || lcs.line_status::text
      end,
      case when pes.id is not null then 'Already running' end
    ], null)::text[] as readiness_blockers,
    lcs.feed_percent,
    lcs.feed_cover_days,
    lcs.actual_today,
    lcs.target_today,
    lcs.last_refreshed_at
  from public.production_lines pl
  left join public.production_groups pg
    on pg.id = pl.group_id
  left join public.line_current_state lcs
    on lcs.line_id = pl.id
  left join public.line_order_contexts loc
    on loc.id = lcs.current_context_id
    and loc.line_id = pl.id
    and loc.is_active = true
  left join public.orders o
    on o.id = loc.order_id
  left join public.customers c
    on c.id = loc.customer_id
  left join public.production_execution_sessions pes
    on pes.line_id = pl.id
    and pes.ended_at is null
)
select
  line_id,
  line_code,
  group_id,
  group_code,
  group_name,
  current_context_id,
  context_id,
  order_id,
  order_code,
  customer_id,
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
from readiness;

alter table public.production_execution_sessions enable row level security;
alter table public.production_execution_events enable row level security;

grant select on public.production_execution_sessions to authenticated;
grant select on public.production_execution_events to authenticated;
grant select on public.production_execution_readiness_view to authenticated;

drop policy if exists "authenticated can read production execution sessions"
on public.production_execution_sessions;
create policy "authenticated can read production execution sessions"
on public.production_execution_sessions
for select
to authenticated
using (true);

drop policy if exists "authenticated can read production execution events"
on public.production_execution_events;
create policy "authenticated can read production execution events"
on public.production_execution_events
for select
to authenticated
using (true);

-- No direct INSERT, UPDATE, or DELETE policies are created.
-- Future writes must go through controlled RPC only.
-- Do not weaken line_order_contexts or line_current_state policies.

create or replace function public.start_production_execution(
  p_line_id uuid,
  p_context_id uuid,
  p_reason text default 'Start production'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_role public.user_role;
  v_profile_active boolean;
  v_line record;
  v_context record;
  v_session_id uuid;
  v_old_status text;
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  select p.role, p.is_active
  into v_role, v_profile_active
  from public.profiles p
  where p.id = v_user_id;

  if v_role is null or coalesce(v_profile_active, false) is not true then
    raise exception 'Active profile required.';
  end if;

  if v_role::text not in ('ADMIN', 'MANAGER', 'PRODUCTION', 'SUPERVISOR') then
    raise exception 'Production execution requires ADMIN, MANAGER, PRODUCTION, or SUPERVISOR role.';
  end if;

  select
    pl.id,
    pl.is_active,
    coalesce(pl.is_special, false) as is_special,
    pg.is_active as group_is_active,
    coalesce(pg.is_ghost, false) as group_is_ghost,
    pg.group_code,
    lcs.current_context_id,
    lcs.line_status::text as line_status
  into v_line
  from public.production_lines pl
  left join public.production_groups pg
    on pg.id = pl.group_id
  left join public.line_current_state lcs
    on lcs.line_id = pl.id
  where pl.id = p_line_id
  for update of pl;

  if v_line.id is null then
    raise exception 'Production line not found.';
  end if;

  if v_line.is_active is not true then
    raise exception 'Line must be active to start production.';
  end if;

  if v_line.is_special is true then
    raise exception 'Special lines cannot start production from this workflow.';
  end if;

  if v_line.group_is_active is not true
     or v_line.group_is_ghost is true
     or v_line.group_code = 'G-11' then
    raise exception 'Ghost or inactive line group cannot start production.';
  end if;

  if v_line.current_context_id is distinct from p_context_id then
    raise exception 'Selected context is not the current line context.';
  end if;

  select *
  into v_context
  from public.line_order_contexts loc
  where loc.id = p_context_id
    and loc.line_id = p_line_id
    and loc.is_active = true;

  if v_context.id is null then
    raise exception 'Active line context not found.';
  end if;

  if v_line.line_status <> 'WAITING_FOR_DATA' then
    raise exception 'Line must be WAITING_FOR_DATA before production start.';
  end if;

  if exists (
    select 1
    from public.production_execution_sessions pes
    where pes.line_id = p_line_id
      and pes.ended_at is null
  ) then
    raise exception 'Line already has an active production execution session.';
  end if;

  if exists (
    select 1
    from public.production_execution_sessions pes
    where pes.context_id = p_context_id
      and pes.ended_at is null
  ) then
    raise exception 'Context already has an active production execution session.';
  end if;

  v_old_status := v_line.line_status;

  insert into public.production_execution_sessions (
    line_id,
    context_id,
    order_id,
    started_at,
    started_by,
    start_reason,
    status
  )
  values (
    p_line_id,
    p_context_id,
    v_context.order_id,
    now(),
    v_user_id,
    p_reason,
    'RUNNING'
  )
  returning id into v_session_id;

  insert into public.production_execution_events (
    session_id,
    line_id,
    context_id,
    event_type,
    from_status,
    to_status,
    event_by,
    reason,
    metadata
  )
  values (
    v_session_id,
    p_line_id,
    p_context_id,
    'START_PRODUCTION',
    v_old_status,
    'RUNNING',
    v_user_id,
    p_reason,
    jsonb_build_object(
      'order_id', v_context.order_id,
      'change_reason', p_reason
    )
  );

  -- Production start changes only the operational state and timestamps.
  -- It intentionally does not update:
  -- - feed_percent
  -- - feed_cover_days
  -- - actual_today
  -- - target_today
  update public.line_current_state
  set
    line_status = 'RUNNING',
    last_event_at = now(),
    last_refreshed_at = now(),
    updated_at = now()
  where line_id = p_line_id;

  if to_regclass('public.audit_logs') is not null then
    insert into public.audit_logs (
      table_name,
      record_id,
      action,
      old_data,
      new_data,
      changed_by,
      changed_at,
      reason
    )
    values (
      'production_execution_sessions',
      v_session_id,
      'START_PRODUCTION',
      jsonb_build_object(
        'line_id', p_line_id,
        'context_id', p_context_id,
        'line_status', v_old_status
      ),
      jsonb_build_object(
        'session_id', v_session_id,
        'line_id', p_line_id,
        'context_id', p_context_id,
        'order_id', v_context.order_id,
        'line_status', 'RUNNING'
      ),
      v_user_id,
      now(),
      p_reason
    );
  end if;

  return v_session_id;
end;
$$;

revoke all on function public.start_production_execution(uuid, uuid, text) from public;
grant execute on function public.start_production_execution(uuid, uuid, text) to authenticated;

comment on function public.start_production_execution(uuid, uuid, text)
is 'Review-only future RPC. Frontend is disconnected until manual migration approval and controlled testing.';

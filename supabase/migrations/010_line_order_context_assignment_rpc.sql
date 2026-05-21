-- Prompt 3 review-only migration.
-- Do not apply automatically. Review against the live schema and RLS policies first.

create or replace function public.assign_line_order_context(
  p_line_id uuid,
  p_order_id uuid,
  p_smv numeric default null,
  p_planned_operators int default null,
  p_planned_target_per_day numeric default null,
  p_change_reason text default 'Planning assignment'
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role text;
  v_line record;
  v_order record;
  v_new_context_id uuid;
begin
  if v_actor_id is null then
    raise exception 'Authentication required for line assignment.';
  end if;

  v_actor_role := public.current_user_role();

  if v_actor_role not in ('ADMIN', 'MANAGER', 'PLANNING') then
    raise exception 'Planning/Admin role required for line assignment.';
  end if;

  select *
  into v_line
  from public.production_lines
  where id = p_line_id
    and is_active = true
  for update;

  if not found then
    raise exception 'Active production line not found.';
  end if;

  select
    o.*,
    c.customer_name,
    sm.style_code
  into v_order
  from public.orders o
  left join public.customers c on c.id = o.customer_id
  left join public.style_master sm on sm.id = o.style_id
  where o.id = p_order_id;

  if not found then
    raise exception 'Order not found.';
  end if;

  update public.line_order_contexts
  set
    is_active = false,
    context_end_at = now()
  where line_id = p_line_id
    and is_active = true;

  insert into public.line_order_contexts (
    line_id,
    order_id,
    order_code,
    customer_id,
    customer_name,
    style_id,
    style_code,
    color_name,
    shipment_date,
    smv,
    planned_operators,
    planned_target_per_day,
    context_start_at,
    is_active,
    created_by,
    change_reason
  )
  values (
    p_line_id,
    p_order_id,
    v_order.order_code,
    v_order.customer_id,
    v_order.customer_name,
    v_order.style_id,
    v_order.style_code,
    v_order.color_name,
    v_order.shipment_date,
    p_smv,
    p_planned_operators,
    p_planned_target_per_day,
    now(),
    true,
    v_actor_id,
    p_change_reason
  )
  returning id into v_new_context_id;

  update public.line_current_state
  set
    current_context_id = v_new_context_id,
    line_status = case
      when line_status in ('STOPPED', 'CHANGEOVER', 'QUALITY_HOLD') then line_status
      else 'WAITING_FOR_DATA'
    end,
    last_refreshed_at = now()
  where line_id = p_line_id;

  insert into public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    details,
    created_at
  )
  values (
    v_actor_id,
    'LINE_ORDER_CONTEXT_ASSIGNED',
    'line_order_contexts',
    v_new_context_id,
    jsonb_build_object(
      'line_id', p_line_id,
      'order_id', p_order_id,
      'change_reason', p_change_reason,
      'smv', p_smv,
      'planned_operators', p_planned_operators,
      'planned_target_per_day', p_planned_target_per_day
    ),
    now()
  );

  return v_new_context_id;
end;
$$;

revoke all on function public.assign_line_order_context(
  uuid,
  uuid,
  numeric,
  int,
  numeric,
  text
) from public;

grant execute on function public.assign_line_order_context(
  uuid,
  uuid,
  numeric,
  int,
  numeric,
  text
) to authenticated;

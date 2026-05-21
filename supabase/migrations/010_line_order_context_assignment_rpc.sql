-- Review-only migration.
-- Safe to apply only after manual review.
-- Does not auto-create assignments.
-- Frontend button remains disabled until Prompt 4B.

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
  v_actor_role public.user_role;
  v_line public.production_lines%rowtype;
  v_order public.orders%rowtype;
  v_style_code text;
  v_closed_previous_context_id uuid;
  v_new_context_id uuid;
begin
  if v_actor_id is null then
    raise exception 'Authentication required for line assignment.';
  end if;

  v_actor_role := public.current_user_role();

  if v_actor_role not in (
    'ADMIN'::public.user_role,
    'MANAGER'::public.user_role,
    'PLANNING'::public.user_role
  ) then
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

  select *
  into v_order
  from public.orders
  where id = p_order_id;

  if not found then
    raise exception 'Order not found.';
  end if;

  select coalesce(v_order.style_code, sm.style_code)
  into v_style_code
  from public.style_master sm
  where sm.id = v_order.style_id;

  v_style_code := coalesce(v_style_code, v_order.style_code);

  select id
  into v_closed_previous_context_id
  from public.line_order_contexts
  where line_id = p_line_id
    and is_active = true
  order by context_start_at desc
  limit 1
  for update;

  update public.line_order_contexts
  set
    is_active = false,
    context_end_at = now(),
    updated_at = now()
  where line_id = p_line_id
    and is_active = true;

  insert into public.line_order_contexts (
    line_id,
    order_id,
    customer_id,
    style_id,
    po_number,
    style_code,
    color_name,
    shipment_date,
    smv,
    planned_operators,
    planned_target_per_day,
    context_start_at,
    is_active,
    change_reason,
    approved_by,
    approved_at,
    created_by
  )
  values (
    p_line_id,
    p_order_id,
    v_order.customer_id,
    v_order.style_id,
    v_order.po_number,
    v_style_code,
    v_order.color_name,
    v_order.shipment_date,
    p_smv,
    p_planned_operators,
    p_planned_target_per_day,
    now(),
    true,
    p_change_reason,
    v_actor_id,
    now(),
    v_actor_id
  )
  returning id into v_new_context_id;

  update public.line_current_state
  set
    current_context_id = v_new_context_id,
    line_status = case
      when line_status in (
        'STOPPED'::public.line_status,
        'CHANGEOVER'::public.line_status,
        'QUALITY_HOLD'::public.line_status,
        'NO_FEEDING'::public.line_status
      ) then line_status
      else 'WAITING_FOR_DATA'::public.line_status
    end,
    last_refreshed_at = now(),
    updated_at = now()
  where line_id = p_line_id;

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
    'line_order_contexts',
    v_new_context_id,
    'LINE_ORDER_CONTEXT_ASSIGNED',
    jsonb_build_object(
      'closed_previous_context_id', v_closed_previous_context_id
    ),
    jsonb_build_object(
      'line_id', p_line_id,
      'order_id', p_order_id,
      'customer_id', v_order.customer_id,
      'style_id', v_order.style_id,
      'po_number', v_order.po_number,
      'style_code', v_style_code,
      'color_name', v_order.color_name,
      'shipment_date', v_order.shipment_date,
      'smv', p_smv,
      'planned_operators', p_planned_operators,
      'planned_target_per_day', p_planned_target_per_day,
      'change_reason', p_change_reason
    ),
    v_actor_id,
    now(),
    p_change_reason
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

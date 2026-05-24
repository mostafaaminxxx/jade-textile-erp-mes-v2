# First Real Assignment Runbook

Purpose: guide the first real ADMIN profile setup and one controlled line-order assignment test for Jade Textile ERP/MES V2.

Status before starting: `profiles_total = 0`, `line_order_contexts = 0`, `line_current_state_with_context = 0`, and `line_current_state_with_feed_percent = 0`.

This is an operational test workflow. It must not create fake users, fake profiles, fake line contexts, fake production, fake downtime, fake feed values, or fake line status.

## 1. Local Env Setup

Create a local `.env.local` file in the app root. Do not commit it.

Add only the public frontend variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://siqystsijkjrqsdrokdh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=REPLACE_WITH_REAL_SUPABASE_ANON_KEY
```

Never add `SUPABASE_SERVICE_ROLE_KEY` to frontend env files. Never use a service role key in `.env.local` for this Next.js browser app.

Restart the dev server after saving `.env.local`:

```powershell
npm run dev
```

Open the app locally and confirm the Supabase connection-required warning is gone.

## 2. Sign Up Real User

1. Open `/login`.
2. Sign up with a real email and password.
3. Wait for the Profile Status Panel to show the signed-in user.
4. Copy the `Auth user id` from the Profile Status Panel.

Expected state immediately after signup:
- Auth user exists.
- Profile row is still missing.
- Assignment permission is `No`.
- No profile has been created automatically.

## 3. Create First Admin Profile

1. Open `/app/settings-admin/preview-test-center`.
2. Copy the first-admin SQL template from the page or from `supabase/manual/001_create_first_admin_profile.sql`.
3. Replace `REPLACE_WITH_AUTH_USER_ID` with the real auth user id copied from the Profile Status Panel.
4. Run the SQL manually in Supabase SQL Editor.
5. Refresh the app.

Confirm in the Profile Status Panel:
- `Profile row = Exists`
- `Role = ADMIN`
- `Active = Active`
- `Assignment permission = Yes`

Confirm in Settings/Admin or Preview & Test Center:
- `profiles_total = 1`
- `active_profiles = 1`
- `assignment_allowed_profiles = 1`

Stop if the app creates a profile automatically. That would be a bug.

## 4. Select Controlled Test Target

Pick one safe real line:
- Prefer `line_status = WAITING_FOR_DATA`.
- Prefer `current_context_id is null`.
- Do not choose a special line.
- Do not choose a ghost or inactive group.
- Do not choose an inactive line.
- Record `line_id` and `line_code`.

Suggested SQL to find candidate lines:

```sql
select
  pl.id as line_id,
  pl.line_code,
  pg.group_code,
  pg.group_name,
  pl.is_active as line_is_active,
  pl.is_special,
  pg.is_active as group_is_active,
  pg.is_ghost as group_is_ghost,
  lcs.line_status,
  lcs.current_context_id,
  lcs.feed_percent,
  lcs.feed_cover_days
from public.production_lines pl
join public.production_groups pg on pg.id = pl.group_id
left join public.line_current_state lcs on lcs.line_id = pl.id
where pl.is_active = true
  and coalesce(pl.is_special, false) = false
  and coalesce(pg.is_active, true) = true
  and coalesce(pg.is_ghost, false) = false
  and lcs.line_status = 'WAITING_FOR_DATA'
  and lcs.current_context_id is null
order by pg.display_order, pl.line_code
limit 50;
```

Pick one real order:
- Prefer material readiness not `BLOCKED`.
- Prefer a simple nearest shipment order.
- Record `order_id`, `order_code`, customer, style, color, and shipment date.

Suggested SQL to find candidate orders:

```sql
select
  o.id as order_id,
  o.order_code,
  o.po_number,
  c.customer_name,
  coalesce(o.style_code, sm.style_code) as style_code,
  o.color_name,
  o.shipment_date,
  o.order_quantity,
  o.order_status,
  mr.readiness_status as material_readiness_status,
  mr.fabric_status,
  mr.accessory_status
from public.orders o
left join public.customers c on c.id = o.customer_id
left join public.style_master sm on sm.id = o.style_id
left join public.material_readiness mr on mr.order_id = o.id
where coalesce(o.order_status, '') not in ('CLOSED', 'CANCELLED')
  and (mr.readiness_status is null or mr.readiness_status::text <> 'BLOCKED')
order by o.shipment_date nulls last, o.order_code
limit 50;
```

If WIP readiness is only available at customer/sewing-type/sub-type level, treat it as a planning hint only. Do not treat it as line-specific feed data.

## 5. Before Assignment Baseline SQL

Before clicking the assignment button, run this SQL in Supabase SQL Editor and save the output.

Replace `REPLACE_WITH_LINE_ID` with the selected real line id.

```sql
select count(*) as line_order_contexts_before
from public.line_order_contexts;

select
  line_id,
  current_context_id,
  line_status,
  feed_percent,
  feed_cover_days,
  last_refreshed_at,
  updated_at
from public.line_current_state
where line_id = 'REPLACE_WITH_LINE_ID';

select
  count(*) as active_contexts_for_selected_line_before
from public.line_order_contexts
where line_id = 'REPLACE_WITH_LINE_ID'
  and is_active = true;
```

Expected baseline for the current first test:
- `line_order_contexts_before = 0`
- `current_context_id is null`
- `line_status = WAITING_FOR_DATA`
- `feed_percent is null`
- `feed_cover_days is null`
- `active_contexts_for_selected_line_before = 0`

Stop if the selected line already has an active context.

## 6. Perform Assignment In App

1. Open `/app/orders-planning/line-assignment`.
2. Select the recorded real line.
3. Select the recorded real order.
4. Review the assignment preview warnings.
5. Click `Create assignment`.
6. In the confirmation dialog, set change reason to:

```text
Controlled first assignment test
```

7. Leave optional SMV, planned operators, and planned target per day blank unless real values are known.
8. Click `Confirm assignment`.
9. Record the returned context id from the success message.

The assignment creates a line context only. It must not start production, mark the line running, create downtime, update `feed_percent`, or update `feed_cover_days`.

## 7. After Assignment Verification SQL

Replace:
- `REPLACE_WITH_LINE_ID` with the selected line id.
- `REPLACE_WITH_CONTEXT_ID` with the context id returned by the app.
- `REPLACE_WITH_BASELINE_CONTEXT_COUNT` with the saved `line_order_contexts_before` value.

```sql
select
  count(*) as line_order_contexts_after,
  count(*) - REPLACE_WITH_BASELINE_CONTEXT_COUNT as context_count_delta
from public.line_order_contexts;

select
  id,
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
  context_end_at,
  is_active,
  change_reason,
  approved_by,
  approved_at,
  created_by,
  created_at,
  updated_at
from public.line_order_contexts
where id = 'REPLACE_WITH_CONTEXT_ID';

select
  line_id,
  current_context_id,
  line_status,
  feed_percent,
  feed_cover_days,
  last_refreshed_at,
  updated_at
from public.line_current_state
where line_id = 'REPLACE_WITH_LINE_ID';

select
  count(*) as active_contexts_for_selected_line_after
from public.line_order_contexts
where line_id = 'REPLACE_WITH_LINE_ID'
  and is_active = true;

select
  id,
  table_name,
  record_id,
  action,
  old_data,
  new_data,
  changed_by,
  changed_at,
  reason
from public.audit_logs
where table_name = 'line_order_contexts'
  and record_id = 'REPLACE_WITH_CONTEXT_ID'
  and action = 'LINE_ORDER_CONTEXT_ASSIGNED'
order by changed_at desc;
```

Expected verification:
- `context_count_delta = 1`
- The new context id exists.
- The new context has `is_active = true`.
- The new context uses real order/customer/style/color/shipment fields.
- The selected line has `current_context_id = REPLACE_WITH_CONTEXT_ID`.
- Exactly one active context exists for the selected line.
- `line_status` remains `WAITING_FOR_DATA` unless it already had a protected real status.
- `feed_percent` remains unchanged or null.
- `feed_cover_days` remains unchanged or null.
- `audit_logs` contains one `LINE_ORDER_CONTEXT_ASSIGNED` row for the new context.

## 8. UI Verification

Refresh the app after the assignment.

Verify:
- Live Factory Map selected line shows an active context indicator.
- Group view selected line shows the active context.
- Line Detail Drawer shows the real order/context fields.
- Line Detail Drawer shows PO, style, color, shipment date, SMV/operators/target only when real values exist.
- Line status is not shown as `RUNNING` unless the real database status says `RUNNING`.
- No fake customer, PO, style, feed value, production, or downtime appears.

## 9. Rollback If Needed

Use `supabase/manual/002_rollback_controlled_assignment_test.sql` only if the controlled test assignment must be closed.

1. Replace `REPLACE_WITH_CONTEXT_ID` with the real context id.
2. Replace `REPLACE_WITH_LINE_ID` with the selected line id.
3. Run the SQL manually in Supabase SQL Editor.

Then verify:

```sql
select
  id,
  line_id,
  is_active,
  context_end_at,
  updated_at
from public.line_order_contexts
where id = 'REPLACE_WITH_CONTEXT_ID';

select
  line_id,
  current_context_id,
  line_status,
  feed_percent,
  feed_cover_days,
  updated_at
from public.line_current_state
where line_id = 'REPLACE_WITH_LINE_ID';
```

Expected rollback:
- The selected context has `is_active = false`.
- The selected context has `context_end_at` populated.
- The selected line has `current_context_id is null`.
- `line_status` is unchanged.
- `feed_percent` is unchanged or null.
- `feed_cover_days` is unchanged or null.

## 10. Success Criteria

The controlled test succeeds only if all of these are true:
- One context was created only.
- One selected line was updated only.
- The assignment was created by a signed-in user with ADMIN, MANAGER, or PLANNING profile role.
- No feed fields changed.
- No line was marked running automatically.
- No fake operational data appeared.
- UI reload shows the real context on the selected line.
- The rollback template is available if the test context must be closed.

## 11. Stop Criteria

Stop immediately and report the result if any of these happen:
- Assignment button enables without a signed-in user.
- Assignment button enables without a profile.
- Assignment works without ADMIN, MANAGER, or PLANNING role.
- `feed_percent` changes.
- `feed_cover_days` changes.
- `line_status` becomes `RUNNING` automatically.
- Multiple contexts are created.
- The wrong line is updated.
- A service role key appears anywhere in frontend code, `.env.local`, browser output, or committed files.
- The app creates a profile automatically.

## 12. What To Record For Prompt 4G

After the human test, record:
- Auth user id.
- Profile id and role.
- Selected line id and line code.
- Selected order id and order code.
- Baseline context count.
- New context id.
- After-assignment verification SQL output.
- Whether rollback was run.
- Any UI mismatch found in Live Factory Map, Group View, or Line Detail Drawer.

Do not record passwords, anon keys, service role keys, or other secrets.

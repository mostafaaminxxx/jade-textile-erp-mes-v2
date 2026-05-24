# First Real Assignment Runbook

## 1. Purpose

This is the first controlled test to prove that one real order can be assigned to one real production line without starting production, without changing feed percent, and without creating fake operational data.

This runbook is for human-run auth/profile setup and one controlled assignment test only. It must not create fake users, fake profiles, fake line contexts, fake production, fake downtime, fake feed values, or fake line status.

## 2. Pre-Test Conditions

Expected before the test:

| Check | Expected value |
| --- | ---: |
| `profiles_total` | `0` or `1`, depending on whether the first admin profile has already been created |
| `line_order_contexts` | `0` |
| `line_current_state_with_context` | `0` |
| `line_current_state_with_feed_percent` | `0` |

If line contexts, line current contexts, or feed percent rows already exist, stop and review the database state before running the first assignment test.

## 3. Local Environment Setup

Create `.env.local` locally only. Never commit it.

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

For the Jade Textile ERP/MES V2 Supabase project, the URL is:

```env
NEXT_PUBLIC_SUPABASE_URL=https://siqystsijkjrqsdrokdh.supabase.co
```

Add the real anon key locally. Do not paste it into docs, GitHub, chat, screenshots, or committed files.

Warning:
- Never add `SUPABASE_SERVICE_ROLE_KEY`.
- Never use a service role key in frontend code.
- Never commit `.env.local`.

## 4. Start Local App

Start the app:

```powershell
npm run dev
```

Use these routes during the test:

- `/login`
- `/app/settings-admin/preview-test-center`
- `/app/orders-planning/line-assignment`
- `/app/live-factory-map`

After starting the app with `.env.local` configured, confirm the Supabase connection-required warning is gone.

## 5. Create Real Auth User

1. Open `/login`.
2. Sign up with a real email and password.
3. Wait for the Profile Status Panel to show the signed-in user.
4. Copy the `Auth user id` from the Profile Status Panel.
5. Confirm the profile row shows missing at first.

Expected immediately after signup:
- Auth user exists.
- Profile row is missing.
- Assignment permission is `No`.
- The app has not created an admin profile automatically.

## 6. Create First Admin Profile Manually

Use `supabase/manual/001_create_first_admin_profile.sql`.

1. Open `/app/settings-admin/preview-test-center`.
2. Copy the first-admin SQL template from Preview & Test Center or the local file.
3. Replace `REPLACE_WITH_AUTH_USER_ID` with the real auth user id.
4. Run the SQL manually in Supabase SQL Editor.
5. Refresh the app.

Verify in Profile Status Panel:
- `Profile row = Exists`
- `Role = ADMIN`
- `Active = Active`
- `Assignment permission = Yes`

Stop if the app creates a profile automatically. Profiles must be created manually for this first setup.

## 7. Choose Controlled Test Target

Line selection rules:
- Choose a real active line.
- Avoid `G-11`.
- Avoid inactive groups.
- Avoid ghost groups.
- Avoid special lines.
- Choose a line with no active context.
- Choose a line with `WAITING_FOR_DATA`.
- Record `line_id` and `line_code`.

Optional SQL to find candidate lines:

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
  and pg.group_code <> 'G-11'
  and lcs.line_status = 'WAITING_FOR_DATA'
  and lcs.current_context_id is null
order by pg.display_order, pl.line_code
limit 50;
```

Order selection rules:
- Choose a real order.
- Avoid obviously blocked material if possible.
- Prefer a simple/customer-known order.
- Record `order_id`, `order_code`, customer, style, color, and shipment date.

Optional SQL to find candidate orders:

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

WIP readiness may exist at customer/sewing-type/sub-type level. Treat it as a planning hint only unless a real line-order context links it to the selected line.

## 8. Baseline SQL Before Assignment

Run this SQL in Supabase SQL Editor before clicking assignment. Save the output.

Replace `REPLACE_WITH_LINE_ID` with the selected real line id.

```sql
select count(*)::int as line_order_contexts_before
from public.line_order_contexts;

select
  line_id,
  current_context_id,
  line_status,
  feed_percent,
  feed_cover_days,
  actual_today,
  target_today,
  last_refreshed_at
from public.line_current_state
where line_id = 'REPLACE_WITH_LINE_ID';

select count(*)::int as active_contexts_for_selected_line_before
from public.line_order_contexts
where line_id = 'REPLACE_WITH_LINE_ID'
  and is_active = true;
```

Expected baseline:
- `line_order_contexts_before = 0`
- selected `current_context_id is null`
- selected `line_status = WAITING_FOR_DATA`
- selected `feed_percent is null`
- selected `feed_cover_days is null`
- selected `actual_today` is unchanged before/after the test
- selected `target_today` is unchanged before/after the test
- `active_contexts_for_selected_line_before = 0`

## 9. Perform Assignment In App

1. Open `/app/orders-planning/line-assignment`.
2. Select the chosen real line.
3. Select the chosen real order.
4. Open the confirmation dialog.
5. Set reason to:

```text
Controlled first assignment test
```

6. Leave SMV, operators, and target blank unless real values are known.
7. Confirm assignment once only.
8. Record the returned context id.

The assignment must only create the line-order context. It must not start production, update feed percent, update feed cover days, create downtime, or mark the line running.

## 10. Verification SQL After Assignment

Replace:
- `REPLACE_WITH_CONTEXT_ID` with the returned context id.
- `REPLACE_WITH_LINE_ID` with the selected line id.

```sql
select count(*)::int as line_order_contexts_after
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
  actual_today,
  target_today,
  last_refreshed_at,
  updated_at
from public.line_current_state
where line_id = 'REPLACE_WITH_LINE_ID';

select count(*)::int as active_contexts_for_selected_line_after
from public.line_order_contexts
where line_id = 'REPLACE_WITH_LINE_ID'
  and is_active = true;

select
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
order by changed_at desc;
```

Compare `line_order_contexts_after` to the saved `line_order_contexts_before`.

## 11. Expected Results

Must be true:
- `line_order_contexts` increased by exactly `1`.
- selected `line_current_state.current_context_id = new context id`.
- Exactly one active context exists for the selected line.
- `line_status` remains `WAITING_FOR_DATA` unless it had a protected status before assignment.
- `feed_percent` remains null or unchanged.
- `feed_cover_days` remains null or unchanged.
- `actual_today` remains unchanged.
- `target_today` remains unchanged.
- Audit log exists.
- No other line is updated.

## 12. UI Verification

Check:
- Live Factory Map selected line shows active context.
- Group view selected line shows active context.
- Line Detail Drawer shows real PO/style/color/shipment/context data.
- Line is not shown as `RUNNING` unless it was already real `RUNNING`.
- Feed bar does not appear unless `feed_percent` is real.
- No fake customer/order/style appears elsewhere.

## 13. Rollback If Needed

Use `supabase/manual/002_rollback_controlled_assignment_test.sql`.

Instructions:
1. Replace `REPLACE_WITH_CONTEXT_ID`.
2. Replace `REPLACE_WITH_LINE_ID`.
3. Run manually in Supabase SQL Editor.

Verify rollback:
- selected context `is_active = false`.
- `context_end_at is not null`.
- selected line `current_context_id` is cleared only if it matched that context.
- `line_status` unchanged.
- `feed_percent` unchanged.
- `feed_cover_days` unchanged.

## 14. Stop Criteria

Stop immediately if:
- Assignment button enables without signed-in user.
- Assignment button enables without ADMIN/MANAGER/PLANNING profile.
- Assignment succeeds without role.
- `feed_percent` changes.
- `feed_cover_days` changes.
- `line_status` becomes `RUNNING` automatically.
- More than one context is created.
- Wrong line is updated.
- Service role key appears anywhere.
- Fake data appears.

## 15. Pass/Fail Checklist

| Check | Pass/Fail | Notes |
| --- | --- | --- |
| Auth user created |  |  |
| Admin profile created |  |  |
| Assignment permission yes |  |  |
| Selected line recorded |  |  |
| Selected order recorded |  |  |
| Baseline SQL captured |  |  |
| Assignment created once |  |  |
| Context id recorded |  |  |
| Post SQL verified |  |  |
| Live Map verified |  |  |
| Line Detail verified |  |  |
| Feed protected |  |  |
| Rollback performed if needed |  |  |

Do not record passwords, anon keys, service role keys, or other secrets in this checklist.

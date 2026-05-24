-- Review-only migration.
-- Safe to apply only after manual review.
-- Adds read-only SELECT policies for authenticated app users.
-- Does not add anonymous public reads.
-- Does not add insert, update, delete, or write policies.
-- Does not weaken assignment RPC permissions.

alter table public.customers enable row level security;
drop policy if exists "authenticated_read_customers" on public.customers;
create policy "authenticated_read_customers"
on public.customers
for select
to authenticated
using (true);

alter table public.production_groups enable row level security;
drop policy if exists "authenticated_read_production_groups" on public.production_groups;
create policy "authenticated_read_production_groups"
on public.production_groups
for select
to authenticated
using (true);

alter table public.production_lines enable row level security;
drop policy if exists "authenticated_read_production_lines" on public.production_lines;
create policy "authenticated_read_production_lines"
on public.production_lines
for select
to authenticated
using (true);

alter table public.line_current_state enable row level security;
drop policy if exists "authenticated_read_line_current_state" on public.line_current_state;
create policy "authenticated_read_line_current_state"
on public.line_current_state
for select
to authenticated
using (true);

alter table public.style_master enable row level security;
drop policy if exists "authenticated_read_style_master" on public.style_master;
create policy "authenticated_read_style_master"
on public.style_master
for select
to authenticated
using (true);

alter table public.orders enable row level security;
drop policy if exists "authenticated_read_orders" on public.orders;
create policy "authenticated_read_orders"
on public.orders
for select
to authenticated
using (true);

alter table public.production_plans enable row level security;
drop policy if exists "authenticated_read_production_plans" on public.production_plans;
create policy "authenticated_read_production_plans"
on public.production_plans
for select
to authenticated
using (true);

alter table public.production_plan_daily_quantities enable row level security;
drop policy if exists "authenticated_read_production_plan_daily_quantities" on public.production_plan_daily_quantities;
create policy "authenticated_read_production_plan_daily_quantities"
on public.production_plan_daily_quantities
for select
to authenticated
using (true);

alter table public.order_operation_routes enable row level security;
drop policy if exists "authenticated_read_order_operation_routes" on public.order_operation_routes;
create policy "authenticated_read_order_operation_routes"
on public.order_operation_routes
for select
to authenticated
using (true);

alter table public.material_readiness enable row level security;
drop policy if exists "authenticated_read_material_readiness" on public.material_readiness;
create policy "authenticated_read_material_readiness"
on public.material_readiness
for select
to authenticated
using (true);

alter table public.fabric_stock_items enable row level security;
drop policy if exists "authenticated_read_fabric_stock_items" on public.fabric_stock_items;
create policy "authenticated_read_fabric_stock_items"
on public.fabric_stock_items
for select
to authenticated
using (true);

alter table public.cut_panel_wip enable row level security;
drop policy if exists "authenticated_read_cut_panel_wip" on public.cut_panel_wip;
create policy "authenticated_read_cut_panel_wip"
on public.cut_panel_wip
for select
to authenticated
using (true);

alter table public.wip_readiness enable row level security;
drop policy if exists "authenticated_read_wip_readiness" on public.wip_readiness;
create policy "authenticated_read_wip_readiness"
on public.wip_readiness
for select
to authenticated
using (true);

alter table public.import_batches enable row level security;
drop policy if exists "authenticated_read_import_batches" on public.import_batches;
create policy "authenticated_read_import_batches"
on public.import_batches
for select
to authenticated
using (true);

alter table public.source_files enable row level security;
drop policy if exists "authenticated_read_source_files" on public.source_files;
create policy "authenticated_read_source_files"
on public.source_files
for select
to authenticated
using (true);

alter table public.line_order_contexts enable row level security;
drop policy if exists "authenticated_read_line_order_contexts" on public.line_order_contexts;
create policy "authenticated_read_line_order_contexts"
on public.line_order_contexts
for select
to authenticated
using (true);

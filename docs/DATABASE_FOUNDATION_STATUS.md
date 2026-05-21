# Database Foundation Status

Supabase project: `jade-textile-erp-mes-v2`

The database foundation is real and already exists externally in Supabase. The app shell reads it through Supabase JS when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured.

Current phase: foundation visibility and real-data verification.

Prompt 3 status:

- Line assignment workflow foundation is prepared.
- `/app/orders-planning/line-assignment` is read-only and creates no records.
- `supabase/migrations/010_line_order_context_assignment_rpc.sql` exists for future review and has not been applied automatically.
- `line_order_contexts` remains `0` until an authenticated Planning/Admin user creates a real assignment through a reviewed role-gated workflow.

| Table / layer | Count / status |
| --- | ---: |
| customers | 6 |
| production_groups | 15 |
| production_lines | 127 |
| line_current_state | 127, all `WAITING_FOR_DATA` |
| style_master | 472 |
| orders | 680 |
| order_items | 680 |
| production_plans | 680 |
| production_plan_daily_quantities | 990 |
| order_operation_routes | 680 |
| fabric_stock_items | 1802 |
| material_readiness | 780 |
| cut_panel_wip | 204 |
| wip_readiness | 51 |
| line_order_contexts | 0 |

Interpretation:

- Factory structure, orders, planning, material readiness, and WIP readiness are loaded from real Supabase rows.
- `line_order_contexts = 0`, so no production line has an active assigned order yet.
- Live Factory Map must show real groups and real lines, but line cards must remain in `WAITING_FOR_DATA` / no active order context until planning creates real line-order contexts.
- Assignment previews must use only selected real orders and real lines.
- No frontend code may use or expose `SUPABASE_SERVICE_ROLE_KEY`.

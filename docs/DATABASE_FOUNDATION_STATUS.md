# Database Foundation Status

Supabase project: `jade-textile-erp-mes-v2`

The database foundation already exists externally in Supabase.

Current foundation counts:

| Table | Count |
| --- | ---: |
| customers | 6 |
| production_groups | 15 |
| production_lines | 127 |
| style_master | 472 |
| orders | 680 |
| production_plans | 680 |
| material_readiness | 780 |
| fabric_stock_items | 1802 |
| cut_panel_wip | 204 |
| wip_readiness | 51 |
| line_order_contexts | 0 |
| line_current_state | 127 WAITING_FOR_DATA |

The first shell reads these tables through Supabase JS when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured.

No frontend code may use or expose `SUPABASE_SERVICE_ROLE_KEY`.

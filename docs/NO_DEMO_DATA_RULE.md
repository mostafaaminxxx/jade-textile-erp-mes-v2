# No Demo Data Rule

Jade Textile ERP/MES V2 must represent the real factory only.

The application must never:

- insert fake data
- seed demo data
- create fake KPIs
- invent line statuses
- invent feed percent
- invent active orders on lines
- convert `WAITING_FOR_DATA` into running, stopped, or changeover states

Required behavior:

- Missing Supabase environment variables show `Supabase connection required.`
- Connected Supabase tables or views with no rows show `Waiting for real factory data.`
- `line_current_state` is rendered honestly.
- Feed bars are shown only when `feed_percent` exists.
- Customer, PO, style, shipment date, and production/feed details appear on line cards only when a real `line_order_contexts` row exists.
- Since the current foundation has `line_order_contexts = 0`, line cards must show no active order context.

Prompt 2 scope:

- Make the real database foundation visible and professional.
- Do not build downtime entry, production entry, import uploads, auth workflows, or planning assignment flows yet.
- Do not create `line_order_contexts` rows.
- Do not update `line_current_state.feed_percent`.

This rule protects operational trust. A factory manager must be able to assume that every visible number is tied to a real record or is clearly marked unavailable.

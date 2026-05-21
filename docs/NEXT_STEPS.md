# Next Steps

Current status:

- Database foundation is real.
- App shell is pushed to the clean GitHub repository.
- Current phase is foundation visibility and real-data verification.
- Live Factory Map represents real groups and lines, with line assignment honestly waiting because `line_order_contexts` is empty.

Recommended next build sequence:

1. Line-order context workflow
   - Assign real orders to real lines.
   - Link planning, material readiness, WIP readiness, and line cards through real context rows.

2. Downtime workflow
   - Add downtime schema/workflow only after roles and line contexts are active.
   - Keep all stopped/hold states tied to real records.

3. Production execution workflow
   - Add production entry after authentication, role assignment, and approval boundaries are defined.
   - Feed line cards from real production and WIP signals only.

4. Auth and roles
   - Activate supervisor, planning, production, quality, warehouse, manager, and admin gates before enabling writes.

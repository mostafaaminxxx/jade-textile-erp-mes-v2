# Next Steps

Current status:

- Database foundation is real.
- App shell is pushed to the clean GitHub repository.
- Current phase is foundation visibility and real-data verification.
- Live Factory Map represents real groups and lines, with line assignment honestly waiting because `line_order_contexts` is empty.
- Line assignment workflow foundation is prepared as a read-only planning screen.
- Assignment RPC SQL file is created for review but has not been applied.
- No line contexts have been created yet.

Recommended next build sequence:

1. Review and apply assignment migration
   - Review `supabase/migrations/010_line_order_context_assignment_rpc.sql` against the live schema.
   - Apply only after confirming auth, roles, RLS, and audit log columns.

2. Enable role-gated assignment writes
   - Connect the Line Assignment Center button to the reviewed RPC.
   - Allow only authenticated ADMIN, MANAGER, or PLANNING users.
   - Keep assignments user-selected; no automatic context creation.

3. Downtime workflow
   - Add downtime schema/workflow only after roles and line contexts are active.
   - Keep all stopped/hold states tied to real records.

4. Production execution workflow
   - Add production entry after authentication, role assignment, and approval boundaries are defined.
   - Feed line cards from real production and WIP signals only.

5. Auth and roles
   - Activate supervisor, planning, production, quality, warehouse, manager, and admin gates before enabling writes.

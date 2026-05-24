# Next Steps

Current status:

- Database foundation is real.
- App shell is pushed to the clean GitHub repository.
- Current phase is foundation visibility and real-data verification.
- Live Factory Map represents real groups and lines, with line assignment honestly waiting because `line_order_contexts` is empty.
- Line assignment workflow is enabled only through authenticated, role-gated, user-selected writes.
- Assignment RPC SQL file has been manually reviewed and applied in Supabase.
- Auth/profile setup is now required before the first assignment test.
- First admin/planning profile must be created manually after a real signup.
- Preview & Test Center exists at `/app/settings-admin/preview-test-center`.
- Manual first admin and rollback SQL templates are visible in app for copy/reference only.
- First controlled line assignment test passed.
- One real line-order context exists for `H8` / `G-1`.
- `H8` remains `WAITING_FOR_DATA` and has no feed percent or feed cover days.

Recommended next build sequence:

1. Prompt 5B option A: Line Detail Drawer and Context Review polish
   - Improve active context review surfaces.
   - Make context fields easier to inspect for supervisors and planners.
   - Keep all writes disabled except the existing assignment flow.

2. Prompt 5B option B: Start Production Execution state machine foundation
   - Define allowed future state transitions.
   - Prepare review-only SQL/RPC design.
   - Do not enable production or downtime writes until reviewed.

3. Downtime workflow
   - Add downtime schema/workflow only after roles and line contexts are active.
   - Keep all stopped/hold states tied to real records.

4. Production execution workflow
   - Add production entry after authentication, role assignment, and approval boundaries are defined.
   - Feed line cards from real production and WIP signals only.

5. Broader auth and roles
   - Extend supervisor, production, quality, warehouse, maintenance, manager, and admin gates before enabling more writes.

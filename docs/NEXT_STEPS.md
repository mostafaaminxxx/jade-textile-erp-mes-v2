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
- Prompt 5B adds a reusable Line Detail Drawer / Context Review surface for Live Factory Map, Group View, and Line Assignment Center.
- The drawer is read-only and separates operational status, assignment status, and execution status.
- Prompt 5C adds the production execution state machine foundation.
- Production start remains disabled until the migration/RPC is manually reviewed, applied, and tested.
- Prompt 5D replaces migration 012 with the full review-only production execution database foundation.
- Migration 012 must not be applied until manual review is complete.
- Prompt 5E-1 hardens migration 012 with a direct `line_current_state` lock before start-production validation.
- Prompt 5E-2 adds final pre-apply hardening, optional audit compatibility checks, rollback comments, and post-apply verification comments.
- Prompt 5E-3 applied migration 012 safely and verified the readiness view.
- Prompt 5E-4 connects the Production Execution UI to `production_execution_readiness_view`.
- Start Production remains disabled and the frontend still does not call `start_production_execution`.
- Prompt 5E-5 prepares the backend-only RPC test plan and rollback SQL for `start_production_execution`.
- Prompt 5E-6 completed a backend-only RPC technical test on T20.
- The RPC passed: one session/event was created, T20 changed to `RUNNING`, feed/actual/target fields stayed unchanged, and strict cleanup rollback restored sessions/events to zero.
- H8 was not touched and remains protected.
- T20 remains assigned and `READY_TO_START` for future controlled testing.
- Prompt 5F adds read-only production session review and execution history UI.
- The Vercel build hardening patch keeps the history area as a simple read-only placeholder using readiness/schema counts.
- Start Production remains disabled and no frontend execution write path exists.

Recommended next build sequence:

1. Prompt 5E-7: Prepare frontend gated Start Production button
   - Keep it behind explicit confirmation and role gate.
   - Keep it disabled by default until final approval.
   - Use T20 as the controlled test line if a frontend test is approved.
   - Do not touch H8.

2. Prompt 5F-2: Improve history/audit evidence before enabling writes
   - Reintroduce full sessions/events history cards after Vercel build stability is confirmed.
   - Show documentation evidence for the strict-cleaned T20 backend RPC test.
   - Consider a future audit-preserving backend test if management wants database history retained.
   - Keep operational writes disabled until review passes.

3. Prompt 5E option B: Assignment close/change workflow design
   - Prepare a controlled close/change assignment design.
   - Keep direct overwrite blocked.
   - Require explicit user-selected context changes and audit logging.

4. Downtime workflow
   - Add downtime schema/workflow only after roles and line contexts are active.
   - Keep all stopped/hold states tied to real records.

5. Production execution workflow
   - Add production entry after authentication, role assignment, and approval boundaries are defined.
   - Feed line cards from real production and WIP signals only.

6. Broader auth and roles
   - Extend supervisor, production, quality, warehouse, maintenance, manager, and admin gates before enabling more writes.

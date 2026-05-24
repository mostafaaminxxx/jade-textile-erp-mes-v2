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

Recommended next build sequence:

1. Prompt 5E-3: Controlled manual apply of migration 012 and readiness-view verification
   - Manually review `supabase/migrations/012_production_execution_state_machine_foundation.sql`.
   - Apply only after 5E-2 passes.
   - Verify `production_execution_readiness_view` first.
   - Confirm H8 appears as `READY_TO_START`.
   - Confirm no production execution sessions/events were created by applying the migration.
   - Do not enable frontend Start Production yet.

2. Prompt 5E option B: Assignment close/change workflow design
   - Prepare a controlled close/change assignment design.
   - Keep direct overwrite blocked.
   - Require explicit user-selected context changes and audit logging.

3. Downtime workflow
   - Add downtime schema/workflow only after roles and line contexts are active.
   - Keep all stopped/hold states tied to real records.

4. Production execution workflow
   - Add production entry after authentication, role assignment, and approval boundaries are defined.
   - Feed line cards from real production and WIP signals only.

5. Broader auth and roles
   - Extend supervisor, production, quality, warehouse, maintenance, manager, and admin gates before enabling more writes.

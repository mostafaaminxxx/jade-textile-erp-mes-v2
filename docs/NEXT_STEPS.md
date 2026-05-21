# Next Steps

Current status:

- Database foundation is real.
- App shell is pushed to the clean GitHub repository.
- Current phase is foundation visibility and real-data verification.
- Live Factory Map represents real groups and lines, with line assignment honestly waiting because `line_order_contexts` is empty.
- Line assignment workflow is enabled only through authenticated, role-gated, user-selected writes.
- Assignment RPC SQL file has been manually reviewed and applied in Supabase.
- No line contexts have been created yet.

Recommended next build sequence:

1. Validate first real line assignment
   - Sign in with an authenticated `ADMIN`, `MANAGER`, or `PLANNING` profile.
   - Select one real line and one real order in Line Assignment Center.
   - Confirm that the created context appears after reload without changing feed percent or line running status.

2. Downtime workflow
   - Add downtime schema/workflow only after roles and line contexts are active.
   - Keep all stopped/hold states tied to real records.

3. Production execution workflow
   - Add production entry after authentication, role assignment, and approval boundaries are defined.
   - Feed line cards from real production and WIP signals only.

4. Broader auth and roles
   - Extend supervisor, production, quality, warehouse, maintenance, manager, and admin gates before enabling more writes.

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
- No line contexts have been created yet.

Recommended next build sequence:

1. Create first real assignment-ready profile
   - Sign up or sign in from `/login`.
   - Copy the auth user id from the profile status panel.
   - Run `supabase/manual/001_create_first_admin_profile.sql` manually after replacing the placeholder id.

2. Validate first real line assignment
   - Sign in with an authenticated `ADMIN`, `MANAGER`, or `PLANNING` profile.
   - Select one real line and one real order in Line Assignment Center.
   - Confirm that the created context appears after reload without changing feed percent or line running status.
   - Follow `docs/CONTROLLED_ASSIGNMENT_TEST.md`.

3. Downtime workflow
   - Add downtime schema/workflow only after roles and line contexts are active.
   - Keep all stopped/hold states tied to real records.

4. Production execution workflow
   - Add production entry after authentication, role assignment, and approval boundaries are defined.
   - Feed line cards from real production and WIP signals only.

5. Broader auth and roles
   - Extend supervisor, production, quality, warehouse, maintenance, manager, and admin gates before enabling more writes.

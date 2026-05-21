# Controlled Assignment Test

Use this guide only after a real Supabase Auth user exists and a real profile role has been assigned. Do not create fake users, fake profiles, fake line contexts, or fake production data.

## Steps

1. Configure `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Run the app locally.
3. Sign up or sign in from `/login`.
4. Copy the auth user id from `ProfileStatusPanel`.
5. Run `supabase/manual/001_create_first_admin_profile.sql` manually in Supabase SQL Editor after replacing `REPLACE_WITH_AUTH_USER_ID`.
6. Refresh the app and confirm the profile role is `ADMIN`, `MANAGER`, or `PLANNING`.
7. Open `/app/orders-planning/line-assignment`.
8. Select one real production line.
9. Select one real order.
10. Confirm assignment with change reason: `Controlled first assignment test`.

## Verify

- `line_order_contexts` increased by `1`.
- The selected `line_current_state.current_context_id` is not null.
- `line_status` remains `WAITING_FOR_DATA` unless it already had a protected status.
- `feed_percent` remains null.
- `feed_cover_days` remains null.
- Live Factory Map shows an active context for the selected line.
- Line Detail shows the real order/context fields.

## Optional Rollback

Use `supabase/manual/002_rollback_controlled_assignment_test.sql` only if the controlled test assignment must be closed. Replace:

- `REPLACE_WITH_CONTEXT_ID`
- `REPLACE_WITH_LINE_ID`

The rollback closes the selected context and clears `current_context_id` for the selected line/context only. It does not change line status, feed percent, or feed cover days.

# Preview QA Report

Date/time: 2026-05-21 16:28:31 +03:00

Commit reviewed: `7504125099f6a82f90f16426892453332fab593c`

Project: Jade Textile ERP/MES V2

Repository: `mostafaaminxxx/jade-textile-erp-mes-v2`

Supabase project: `jade-textile-erp-mes-v2`

## Executive Decision

Decision: GO FOR AUTH/PROFILE SETUP TEST, NOT FACTORY PILOT.

Reason: the app builds cleanly, no fake data path was found, service role exposure was not found, and assignment writes remain auth/profile/role gated. The expected blocker is still real and correct: `profiles_total = 0`, so the first controlled assignment test cannot happen until a real user signs up and the first ADMIN/MANAGER/PLANNING profile is manually created.

## Environment Status

Local app preview:
- Local server responded on `http://127.0.0.1:3000`.
- `.env.local` was not present locally.
- `NEXT_PUBLIC_SUPABASE_URL` was not present locally.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` was not present locally.
- Data routes correctly rendered a Supabase connection-required state instead of inventing data.

Live Supabase read-only status checked through the Supabase connector:

| Metric | Count |
| --- | ---: |
| customers | 6 |
| production_groups | 15 |
| production_lines | 127 |
| style_master | 472 |
| orders | 680 |
| production_plans | 680 |
| material_readiness | 780 |
| wip_readiness | 51 |
| profiles_total | 0 |
| active_profiles | 0 |
| assignment_allowed_profiles | 0 |
| line_order_contexts | 0 |
| line_current_state_with_context | 0 |
| line_current_state_with_feed_percent | 0 |

## Validation Results

| Check | Result | Notes |
| --- | --- | --- |
| `npm install` | PASS | Up to date, audited 401 packages. NPM reported 2 moderate vulnerabilities. |
| `npm run typecheck` | PASS | TypeScript completed successfully. |
| `npm run lint` | PASS | Next lint completed successfully. |
| `npm run build` | PASS | Production build completed successfully. |

## Safety Review

| Safety item | Result | Notes |
| --- | --- | --- |
| No demo data | PASS | No demo or fake operational records were found in the app logic. |
| No fake line contexts | PASS | `line_order_contexts` remains 0 in Supabase. |
| No fake profile creation | PASS | Profile helper does not create profiles from the frontend. |
| No automatic assignment | PASS | Assignment requires a selected real line and selected real order. |
| Assignment write gating | PASS | Frontend checks auth/profile role, and the database RPC remains the real enforcement. |
| Service role key exposure | PASS | No committed service role key was found. Frontend uses only public Supabase client variables. |
| Feed fields protected | PASS | Supabase shows 0 `line_current_state.feed_percent` rows; the assignment flow does not update feed fields. |

## Route Inspection Results

Screenshots were attempted through the Codex in-app browser runtime, but the runtime failed to start with a Windows access-denied error. No local Chrome or Edge executable was available on PATH for a headless fallback, so this QA run uses route HTTP checks plus source inspection instead of screenshots.

All target routes responded with HTTP 200:

| Route | Result | QA notes |
| --- | --- | --- |
| `/login` | PASS | Shows real Supabase Auth login/signup/signout flow, current user status, profile status panel, and no fake admin creation. With missing env vars, it shows "Supabase connection required." |
| `/app/executive-command-center` | PASS | Route loads and is connection-gated locally. Source uses real database summary functions and does not show fake efficiency, fake downtime, or fake production KPIs. |
| `/app/live-factory-map` | PASS WITH LOCAL ENV LIMIT | Route loads and is connection-gated locally. With Supabase env configured, this is expected to show the real group and line foundation. The 127-line visual could not be locally verified in this env-missing QA run. |
| `/app/orders-planning` | PASS | Route loads and includes the Line Assignment Center entry point. No editable planning workflow or automatic assignment was found. |
| `/app/orders-planning/line-assignment` | PASS | Route loads and is connection-gated locally. Component logic keeps the create assignment flow disabled unless a real line, real order, auth user, and allowed profile role are present. |
| `/app/material-wip-readiness` | PASS | Route loads and is connection-gated locally. Source keeps WIP readiness as summary data and does not push fake feed data to lines. |
| `/app/reports-imports` | PASS | Route loads and is connection-gated locally. Source uses import/source file data and does not create fake import history. |
| `/app/settings-admin` | PASS | Route loads, includes environment/database readiness, auth/profile readiness, and a Preview & Controlled Test Center link. With missing env vars, deeper real counts are gated locally. |
| `/app/settings-admin/preview-test-center` | PASS | Route loads and is connection-gated locally. Source includes readiness panels, first admin SQL template display, rollback SQL template display, and does not execute SQL from the frontend. |

## Screenshots

Screenshots created: No.

Reason: Codex in-app browser screenshot tooling failed with a Windows access-denied error, and no installed Chrome or Edge executable was discoverable for a headless screenshot fallback. This report therefore records a route-by-route text inspection instead.

Expected screenshot filenames for a future browser-enabled QA pass:
- `docs/preview-screenshots/01-login.png`
- `docs/preview-screenshots/02-executive-command-center.png`
- `docs/preview-screenshots/03-live-factory-map.png`
- `docs/preview-screenshots/04-orders-planning.png`
- `docs/preview-screenshots/05-line-assignment-center.png`
- `docs/preview-screenshots/06-material-wip-readiness.png`
- `docs/preview-screenshots/07-reports-imports.png`
- `docs/preview-screenshots/08-settings-admin.png`
- `docs/preview-screenshots/09-preview-test-center.png`

## Professional Rating

| Category | Score | Reason |
| --- | ---: | --- |
| Database truth | 9.0 | The app is strongly aligned to real Supabase tables and does not substitute fake operational records. |
| Supabase connection safety | 9.0 | Missing env vars are handled by connection gates instead of fake fallbacks. |
| No-demo-data discipline | 9.5 | The codebase consistently preserves the no-demo/no-mock operational rule. |
| Navigation clarity | 8.0 | Core operational routes are discoverable and organized, with the assignment and preview flows linked from sensible places. |
| Executive Command Center | 8.0 | The page is scoped to real database summary data and avoids invented production KPIs. |
| Live Factory Map | 8.5 | The foundation is conceptually strong and honest about no active contexts, but full 127-line visual verification requires local Supabase env. |
| Orders & Planning | 8.0 | It presents planning summary and assignment entry safely without pretending to be an editable planning board. |
| Line Assignment Center | 8.5 | The selected-line/selected-order flow is well staged and role gated, but cannot be end-to-end tested until profiles exist. |
| Material & WIP Readiness | 8.0 | It correctly summarizes readiness without pushing non-line-specific WIP into line cards. |
| Reports & Imports | 7.5 | It is safe and real-data oriented, but needs richer validation once env-backed import data is visible locally. |
| Settings/Admin | 8.5 | Environment, database, and profile readiness are surfaced in the right administrative area. |
| Preview & Test Center | 8.5 | It centralizes the first-admin and controlled-assignment test process without executing privileged SQL. |
| Auth/profile readiness | 7.5 | The flow is safe and clear, but the database still has no real profiles, so operational writes are not testable yet. |
| Mobile supervisor readiness | 7.0 | The shell is responsive in structure, but floor-user mobile ergonomics still need a real-device/browser pass. |
| UI/UX professional feeling | 8.0 | The control-room style is clean and restrained, with some final polish still best judged from screenshots with real data. |
| Factory operational logic | 8.0 | The current logic respects planning, line state, material/WIP boundaries, and non-starting assignment semantics. |
| Readiness for controlled assignment test | 7.5 | The software path is ready, but the required first real profile is missing. |
| Readiness for factory-floor pilot | 4.5 | Too early for pilot: auth roles, first assignment, downtime, production entry, and live floor workflows still need activation. |

Overall score: 8.0 / 10 for foundation and preview readiness.

Factory-floor pilot score: 4.5 / 10.

## Top Strengths

1. Real Supabase foundation is respected and no fake operational fallback was found.
2. Assignment writes are user-selected and role gated.
3. The database RPC remains the authoritative enforcement layer.
4. Missing Supabase env vars fail safely through connection-required UI.
5. Login/signup does not create fake admin users or profiles.
6. Preview & Test Center makes the first-admin and assignment-test workflow visible in the app.
7. Manual SQL templates are reviewable and are not executed by the frontend.
8. Line assignment does not start production, does not change feed percent, and does not invent line status.
9. Validation is clean across install, typecheck, lint, and build.
10. The app structure is ready for a disciplined first controlled assignment test.

## Top Issues

1. `profiles_total = 0`, so assignment testing is correctly blocked until the first real profile is created.
2. Local `.env.local` is absent, so local browser QA cannot verify real counts or the full 127-line factory map rendering.
3. Browser screenshots could not be captured in this session because the browser runtime was blocked.
4. The role-gated assignment flow has not been end-to-end tested with a real ADMIN/MANAGER/PLANNING profile.
5. Rollback is currently manual SQL, which is appropriate for now but not yet operationally ergonomic.
6. Production entry and downtime entry are intentionally inactive and not pilot-ready.
7. Mobile supervisor readiness still needs a real browser viewport QA pass with Supabase connected.
8. Reports/imports should be rechecked with env-backed real data visible locally.
9. No automated E2E suite exists yet for auth/profile/assignment readiness.
10. `npm install` reports 2 moderate vulnerabilities that should be reviewed before a broader deployment.

## Must Fix Before Next Feature

1. Configure local `.env.local` for a real preview session, keeping it uncommitted.
2. Sign up a real Supabase Auth user through `/login`.
3. Manually create the first ADMIN profile using `supabase/manual/001_create_first_admin_profile.sql`.
4. Re-run Preview & Test Center with env vars present and confirm profile readiness changes from blocked to allowed.
5. Run exactly one controlled assignment test with a selected real line and selected real order, then verify line context and feed-field protection.

## Go/No-Go Detail

| Gate | Decision |
| --- | --- |
| Build passes | GO |
| Fake data absent | GO |
| Service role not exposed | GO |
| Assignment bypass absent | GO |
| Profiles missing | GO FOR AUTH/PROFILE SETUP TEST ONLY |
| Factory-floor pilot | NO-GO |

## Recommended Next Prompt

Prompt 4F: Configure local Supabase preview env, create the first real ADMIN profile after signup, and run one controlled line-order assignment test with rollback verification. Do not add new workflows; verify that `line_order_contexts` increases by exactly 1, `line_current_state.current_context_id` updates only for the selected line, `line_status` remains protected, and `feed_percent`/`feed_cover_days` remain unchanged.

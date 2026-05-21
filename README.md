# Jade Textile ERP/MES V2

Jade Textile Factory System V2 is a real garment factory ERP/MES shell centered on the Live Factory Map.

The product vision is:

- One Factory
- One Data Source
- One Operational Flow
- One Management View
- One Agent Supporting All Teams

## Stack

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui-ready component structure
- Lucide React
- Recharts-ready dependency
- Supabase JS client
- Supabase Auth-ready and Realtime-ready structure
- Vercel-ready project layout

## Setup

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Validate:

```bash
npm run typecheck
npm run lint
npm run build
```

## Environment Variables

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is backend/admin only and must never be exposed in frontend code.

## Supabase Project

Supabase project: `jade-textile-erp-mes-v2`

The database already exists externally. This app does not create schema, insert seed records, or generate demo factory data.

If Supabase environment variables are missing, the UI shows `Supabase connection required.`

If Supabase is connected but a table or view has no rows, the UI shows `Waiting for real factory data.`

## Auth and Profile Setup

`/login` supports real Supabase Auth sign in, sign up, and sign out.

Sign up creates only a real auth user. It does not create an admin profile, assign a role, or enable operational writes.

Before the first assignment test:

- sign up or sign in from `/login`
- copy the auth user id from the profile status panel
- manually create the first real `ADMIN`, `MANAGER`, or `PLANNING` profile in Supabase
- follow `docs/CONTROLLED_ASSIGNMENT_TEST.md`

Manual SQL templates are in `supabase/manual/`. They are review-only and must not be applied automatically.

## No Demo Data Rule

The V2 shell must never:

- insert fake data
- seed demo data
- create fake KPIs
- invent line statuses
- invent feed percent
- invent active orders on lines

`line_current_state` values are rendered honestly. If lines are `WAITING_FOR_DATA`, the UI shows `WAITING_FOR_DATA`.

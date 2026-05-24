# Vercel Deployment Guide

Use this guide to deploy Jade Textile ERP/MES V2 when local Windows Node/npm cannot run the app.

This deployment uses the existing GitHub repository and Vercel's Next.js build pipeline. It does not create users, profiles, line-order contexts, production records, downtime records, or demo data.

## A. Create Vercel Project

1. Go to Vercel.
2. Create a new project.
3. Import this GitHub repository:

```text
mostafaaminxxx/jade-textile-erp-mes-v2
```

4. Set the framework preset to:

```text
Next.js
```

5. Keep the default Next.js output handling.

Vercel should use:

```text
Build Command: npm run build
Output Directory: handled by Next.js
Install Command: npm install
```

## B. Add Environment Variables

Add these variables in the Vercel project settings before deploying:

```env
NEXT_PUBLIC_SUPABASE_URL=https://siqystsijkjrqsdrokdh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PASTE_SUPABASE_ANON_OR_PUBLISHABLE_KEY
```

Warning:

- Never add `SUPABASE_SERVICE_ROLE_KEY` to Vercel frontend environment variables.
- Never expose a service role key to browser code.
- Only public Supabase browser variables should use the `NEXT_PUBLIC_` prefix.

## C. Deploy

1. Click `Deploy`.
2. Wait for the Vercel build to finish successfully.
3. Open the deployed site at:

```text
/login
```

Example:

```text
https://YOUR-VERCEL-DOMAIN.vercel.app/login
```

## D. Test After Deployment

Open `/login` and confirm:

- The login page opens.
- The `Supabase connection required.` message disappears after the Vercel env vars are configured.
- The sign up form is visible.

Then:

1. Sign up with a real email and password.
2. Copy the `Auth user id` from the Profile Status Panel.
3. Confirm the auth user id looks like:

```text
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Do not use:

- OAuth App client ID
- Organization slug
- Organization ID
- Supabase project ID
- Supabase project ref
- Supabase anon key
- Supabase service role key

The only value needed for first-admin profile setup is the real Supabase Auth user id created by signing up through `/login`.

## E. Continue First Assignment Flow

After the deployed login flow creates the real auth user:

1. Open:

```text
/app/settings-admin/preview-test-center
```

2. Use the Preview & Test Center to review readiness.
3. Copy the first-admin SQL template.
4. Replace `REPLACE_WITH_AUTH_USER_ID` with the real auth user id.
5. Run the SQL manually in Supabase SQL Editor.
6. Refresh the deployed app.
7. Confirm the profile exists and assignment permission is allowed.
8. Run the controlled assignment test later using:

```text
docs/FIRST_REAL_ASSIGNMENT_RUNBOOK.md
```

Do not run the assignment test until the real auth profile exists and the tester is intentionally ready to assign one real order to one real line.

## Vercel Readiness Summary

The app is Vercel-ready because:

- It is a standard Next.js App Router project.
- `npm run build` is the build command.
- Next.js handles the deployment output.
- No service role key is required.
- `.env.local` is not committed.
- The frontend uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

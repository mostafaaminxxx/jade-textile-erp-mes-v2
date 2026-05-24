# Local Preview Troubleshooting

Use this guide when the Jade Textile ERP/MES V2 app does not open locally.

## Standard Preview

1. Open PowerShell in the project root.
2. Install dependencies:

```powershell
npm install
```

3. Start the local dev server:

```powershell
npm run dev
```

4. Open:

```text
http://127.0.0.1:3000/login
```

You can also try:

```text
http://localhost:3000/login
```

## Port 3000 Conflict

If port `3000` is busy, start the app on port `3001`:

```powershell
npm run dev:3001
```

Then open:

```text
http://127.0.0.1:3001/login
```

You can also try:

```text
http://localhost:3001/login
```

## Common Windows Messages

If Windows Firewall asks about Node.js, allow Node.js on private networks.

If the browser says connection refused, the dev server is not running. Return to PowerShell and confirm `npm run dev` or `npm run dev:3001` shows a ready message.

If the page briefly returns a `500` after running `npm run build` while a dev server is already open, stop the dev server with `Ctrl+C`, run `npm run dev` again, and refresh `/login`.

If PowerShell says `npm` is not recognized, install Node.js LTS, close PowerShell, open a new PowerShell window, and run:

```powershell
node -v
npm -v
```

Both commands should print version numbers.

If PowerShell says `node.exe` access is denied, check that Node.js is installed normally and that antivirus or Windows security policy is not blocking Node.js.

## Supabase Connection Message

If `/login` opens and says `Supabase connection required.`, the app is running. Configure `.env.local` to enable signup and data access.

Create `.env.local` locally only:

```env
NEXT_PUBLIC_SUPABASE_URL=https://siqystsijkjrqsdrokdh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PASTE_ANON_KEY_HERE
```

Never add `SUPABASE_SERVICE_ROLE_KEY`.

Never commit `.env.local`.

After saving `.env.local`, stop the dev server with `Ctrl+C`, restart it, and open `/login` again.

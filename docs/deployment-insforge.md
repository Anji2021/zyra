# Deploy Zyra with InsForge

Zyra is a **Next.js 16** app (`npm run build` / `npm start`). InsForge Deployments (see [Deployment architecture](https://docs.insforge.dev/core-concepts/deployments/architecture)) build on **Vercel**; env vars are injected at build/runtime per InsForge’s project settings.

## 1. Prepare the repo

- Commit and push the **Zyra** repo to **GitHub** (InsForge connects the repo you select).
- Locally: `npm run build` must pass (CI-style check before deploy).

## 2. Environment variables (InsForge project / deployment UI)

Configure **names only** in InsForge; **never** log values. Variables prefixed with **`NEXT_PUBLIC_`** are embedded in the **browser bundle** — use only **public** Supabase URL + anon key and InsForge base URL + anon key there. Keep **server** secrets without that prefix.

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (no trailing slash). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key (RLS still applies). |
| `GROQ_API_KEY` | Yes | Server-only; assistant. |
| `GOOGLE_PLACES_API_KEY` | Yes | Server-only; specialist search. |
| `TINYFISH_API_KEY` | No | Server-only; enrichment skips if unset. |
| `NEXT_PUBLIC_INSFORGE_BASE_URL` | Yes* | Same backend URL you use locally; **no trailing `/`**. |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | Yes* | For `/api/feedback` InsForge inserts. |

\*If feedback is disabled in prod, you can omit InsForge vars, but `/api/feedback` will return 503 until they are set.

## 3. InsForge deployment steps

1. In InsForge: connect **GitHub**, pick the **Zyra** repository.
2. Framework: **Next.js**.
3. **Build command:** `npm run build`
4. **Start command:** `npm start` (Vercel/Node sets `PORT` as needed.)
5. Add all env vars from the table above (InsForge encrypts at rest; values are not shown in logs by name-only auditing where applicable).

After a successful deploy, InsForge docs describe a live URL pattern such as **`https://{app-key}.insforge.site`** — your exact URL appears in the InsForge deployment UI when status is **READY**.

## 4. Auth and third parties (production)

**Supabase**

- **Authentication → URL configuration:** set **Site URL** to your production origin (e.g. `https://your-app.insforge.site`).
- **Redirect URLs:** include  
  `https://<your-production-host>/auth/callback`  
  (and any custom domain you add later.)

**Google Cloud (OAuth for Supabase Google sign-in)**

- **Authorized JavaScript origins:** production site origin.
- **Authorized redirect URIs:** your Supabase auth callback URL from the Supabase dashboard (Google provider), not only localhost.

Without these, **Google login** will work locally but fail in production.

## 5. Post-deploy validation

Smoke-test on the public URL:

- App loads (marketing `/` and app shell).
- **Google login** and redirect to `/app` or `/onboarding`.
- **Cycle**, **health log**, **assistant**, **specialists** search, **feedback** form.
- **Tinyfish** enrichment: optional; without key, enrichment should degrade gracefully.

## 6. If something fails

- Use **InsForge deployment / build logs** and **Vercel** (if linked) for build errors.
- **502 / missing config:** verify every required env var is set for that deployment (names typos are common).
- **OAuth / redirect loops:** almost always **Supabase redirect URL** or **Google OAuth** console mismatch with the **live** origin.

## 7. API key exposure

- Do **not** prefix `GROQ_API_KEY`, `GOOGLE_PLACES_API_KEY`, or `TINYFISH_API_KEY` with `NEXT_PUBLIC_`.
- Do not import those keys in client components or `use client` modules.

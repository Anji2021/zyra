# Zyra validation checklist — Auth, onboarding & profiles

Use this after wiring **Google sign-in**, **Supabase Auth**, the **`profiles`** table (with RLS), and the **`/onboarding`** flow.

## Environment / API keys (this step)

Set in **`.env.local`** (see `.env.example`):

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |

No new third-party API keys are needed for this step beyond your existing Supabase project (Google OAuth is configured in Supabase + Google Cloud as part of Auth, not new env vars in the app).

Restart `npm run dev` after changing `.env.local`.

---

## Validation checklist

- [ ] **1.** I can sign in with Google.
- [ ] **2.** New users are redirected to `/onboarding`.
- [ ] **3.** Onboarding form saves successfully.
- [ ] **4.** The profile row appears in Supabase **`public.profiles`** (Table Editor or SQL `select * from public.profiles`).
- [ ] **5.** Returning users are redirected to `/app`.
- [ ] **6.** `/app` shows the user’s name from their **profile** (`full_name`), not only Google metadata.
- [ ] **7.** Logging out redirects back to the **landing page** (`/`).
- [ ] **8.** Unauthenticated users **cannot** access `/app` or `/onboarding` directly (expect redirect to `/?auth=required`).

---

## Quick test flow

1. Run the SQL migration for `profiles` + RLS in the Supabase SQL editor (see `supabase/migrations/000001_profiles.sql`).
2. Sign in with a **new** Google account (or delete the user’s profile row in Supabase to re-test onboarding).
3. Complete `/onboarding` → confirm redirect to `/app` and row in `profiles`.
4. Sign out → confirm `/` loads and `/app` redirects unauthenticated users.

---

# Cycle tracking (`public.cycles`)

Run **`supabase/migrations/000003_cycles.sql`** in the Supabase SQL editor first.

## Cycle validation checklist

- [ ] I can log a new period from **`/app/cycle`**.
- [ ] Data appears in Supabase **`public.cycles`** with my **`user_id`**.
- [ ] I can see my past entries (newest first) after save and after refresh.
- [ ] Only my rows appear (RLS + another account cannot see mine).
- [ ] The page does not crash with **empty optional** end date and notes.
- [ ] **Start date** is still required (form + server validation).

---

# Health log (`medicines` & `symptoms`)

Run **`supabase/migrations/000004_medicines_symptoms.sql`** in the Supabase SQL editor first.

## Health log validation checklist

- [ ] I can open **`/app/health-log`** from the app nav.
- [ ] I can add a **medicine** and see it in **`public.medicines`** with my **`user_id`**.
- [ ] I can add a **symptom** and see it in **`public.symptoms`** with my **`user_id`**.
- [ ] After refresh, both histories still show (newest first).
- [ ] Only my rows appear (RLS).
- [ ] Optional fields (dosage, dates, severity, notes) can be left empty where allowed.

---

# Resources (static articles)

No SQL or API keys. Content lives in **`data/resources.ts`**.

## Resources validation checklist

- [ ] **`/app/resources`** opens from the app nav.
- [ ] Article list shows with **search** and **category** filters.
- [ ] Clicking an article opens **`/app/resources/[id]`** with full text.
- [ ] Layout feels **readable**; disclaimer visible on list and article pages.
- [ ] **No external API** calls for this section.

---

# Assistant (Groq + chat history)

Add **`GROQ_API_KEY`** to `.env.local` (server-only; never `NEXT_PUBLIC_`). The app calls Groq only from **`/api/assistant`** (backend).

Run **`supabase/migrations/000005_messages.sql`** in the Supabase SQL editor first (table **`public.messages`**, RLS per user).

## Assistant validation checklist

- [ ] **`/app/assistant`** opens and shows the chat area.
- [ ] **Send** works with a non-empty message; **empty** send does nothing.
- [ ] You see **“Zyra is typing…”** while waiting.
- [ ] **Messages save** in Supabase **`public.messages`** (user row on send, assistant row after reply).
- [ ] **Refresh** loads the last **20** messages in order (oldest at top, newest near input).
- [ ] **Context**: follow-up questions feel coherent with recent turns (last **10** rows inform Groq).
- [ ] **Clear chat** removes your rows in Supabase and empties the UI.
- [ ] **Only my messages** appear (RLS — second account cannot read another user’s rows).
- [ ] **API / Groq failures** show a short friendly line (same as other app errors), not raw stack text (except sign-in / validation errors).
- [ ] Replies stay **educational** (no personal diagnosis or prescriptions).
- [ ] **No crashes** with empty history, long threads, or after clear.
- [ ] Chat **scrolls** toward the latest message when you send or load.

---

# Specialists (Google Places)

Add **`GOOGLE_PLACES_API_KEY`** to **`.env.local`** (server-only; never `NEXT_PUBLIC_`). The app calls Google only from **`/api/specialists`** (backend).

Enable **Places API** (and billing if required) on the same Google Cloud project as the key. Text Search + Place Details are used for listings and phone when available.

## Specialists validation checklist

- [ ] **`/app/specialists`** opens from the **desktop sidebar** or **More** on mobile.
- [ ] Enter a location (e.g. **95054**), choose **Gynecologist**, tap **Search specialists** — results or empty state appears.
- [ ] Each card shows **name**, **address**, **rating** / **reviews** when Places returns them, **open now** when available, **Google Maps** link, **phone** or *“Phone not available”*.
- [ ] Disclaimer copy is visible on the page.
- [ ] **Loading** and **error** states behave sensibly (e.g. missing API key → clear error, not a blank screen).
- [ ] **`GOOGLE_PLACES_API_KEY`** is not referenced in any `NEXT_PUBLIC_` or client-only env usage.

---

# Companion UX polish (layout, nav, home)

No new env vars. After pulling changes, run **`npm run dev`** and walk the app on a **narrow viewport** first.

## UX polish checklist

- [ ] **Layout:** main app content uses a **consistent max width** and vertical rhythm (`AppPageShell` inside the product shell).
- [ ] **Mobile nav:** five tabs — **Home**, **Cycle**, **Health**, **Assistant**, **More** — with a clear **active** state and smooth transitions.
- [ ] **More (`/app/more`):** opens **Profile**, **Resources**, **Specialists**, **Saved**, **Insights**; **desktop sidebar** lists the same destinations.
- [ ] **Home (`/app`):** welcome **“Hi, [Name]”**, **quick actions**, **saved specialists** preview (up to 3) or empty line, **at a glance** snapshots, optional **cycle length** note when two periods exist.
- [ ] **Empty states:** cycle / health / assistant / resources search feel **intentional**, not broken.
- [ ] **Loading:** route **`loading.tsx`** skeletons appear briefly for **app root**, **cycle**, **health log**, and **assistant** (no flash of empty layout).
- [ ] **Errors:** unexpected failures show **“Something went wrong. Please try again.”** (or the server’s short message for auth/validation); **browser console** still logs details where implemented.
- [ ] **Privacy line** appears on **Cycle**, **Health log**, and **Assistant** headers.
- [ ] **Palette / cards** feel a bit **softer** (globals + borders); no harsh jumps between pages.

---

# Saved specialists (`public.saved_specialists`)

Run **`supabase/migrations/000006_saved_specialists.sql`** in the Supabase SQL editor first.

## Saved specialists checklist

- [ ] From **`/app/specialists`**, **Save** on a result with a **place id** inserts a row; the button shows **Saved** and tap again **removes** it (toggle).
- [ ] **`/app/saved`** lists the same cards with **Remove**; refresh keeps data.
- [ ] **Home** shows **Your saved specialists** (up to 3) or *“You haven’t saved any specialists yet”* with a link to search.
- [ ] **Only my rows** appear (RLS); another user cannot read my saved list.
- [ ] **Saved** appears in the **desktop sidebar** and under **More** on mobile.

---


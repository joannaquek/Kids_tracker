# TinyCare — Kids Sickness & Medication Tracker

A private, offline-first health dashboard for parents to track children's sickness history, temperatures, symptoms, and medication schedules.

**Live app:** deployed on [Vercel](https://vercel.com) (see your project dashboard for the production URL).

---

## Phase 1 (current) — Local-first MVP

Data lives in the browser (`localStorage`). No account or backend required.

### Features

| Area | What it does |
|------|----------------|
| **Dashboard** | Child profiles, quick symptom/temperature logging, medication schedules with countdown, health timeline |
| **Analytics** | Temperature trend chart, symptom frequency |
| **Settings** | Export/import JSON backup, clear all data |

### Local development

```bash
cd "/Users/joannaquek/Documents/Kids Tracker"
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### Build

```bash
npm run build    # output in dist/
npm run preview  # serve production build locally
```

### Deploy (Vercel)

- **Framework:** Vite  
- **Build command:** `npm run build`  
- **Output directory:** `dist`  
- **Environment variables:** none required for Phase 1  

Push to `main` on the connected Git repo; Vercel redeploys automatically.

### Data on one device

- Changes save automatically to `localStorage` (key: `kids_tracker_app_data`).
- Use the same production URL and browser; avoid private/incognito if you want data to persist.

### Moving data between devices (manual)

1. **Settings → Export Backup (.json)** on the source device  
2. Transfer the file (AirDrop, email, cloud drive, etc.)  
3. **Settings → Import Backup (.json)** on the target device  

Import **replaces** all data on that device. Re-export and re-import when you want devices aligned.

---

## Phase 2 (planned) — Supabase cloud sync

**Status:** Not started. Documented here for future implementation.

### Goals

- Sign in (email magic link or OAuth) so the same account works on desktop and mobile  
- Sync children, sickness logs, medication schedules, and dose logs to the cloud  
- Optional: replace demo data on first visit with empty state + one-time migration from `localStorage`  
- Optional later: push reminders via Edge Functions + cron (see Phase 2b)

### Why Supabase

- Postgres + Row Level Security for per-user data  
- Auth out of the box  
- Fits the existing React + Vercel stack  
- Can keep `localStorage` as offline cache after sync is added  

### Planned architecture

```text
React app (Vercel)
    ↓ supabase-js
Supabase Auth (login)
    ↓
Postgres tables (RLS: user_id = auth.uid())
    ↓
Optional: Edge Function + pg_cron for medication reminders
```

### Planned schema (draft)

| Table | Purpose |
|-------|---------|
| `profiles` | User display name, linked to `auth.users` |
| `children` | Child profiles (`user_id`, name, dob, avatar, weight, allergies, …) |
| `sickness_logs` | Temperature, symptoms, notes, timestamp |
| `medication_schedules` | Name, dosage, frequency, active flag, `next_dose_at` |
| `dose_logs` | Administered doses, linked to schedule optional |

All tables: **RLS enabled**, policies scoped to `auth.uid()`.

### Planned implementation steps

1. Create Supabase project; add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Vercel env vars (and `.env.local` locally).  
2. SQL migrations for tables + RLS policies.  
3. Add `@supabase/supabase-js`; auth UI (sign up / sign in / sign out).  
4. Refactor `TrackerContext` to read/write Supabase when logged in; fall back to `localStorage` when offline or logged out.  
5. One-time migration: on first login, offer to upload existing `localStorage` data to Supabase.  
6. Conflict strategy: last-write-wins per record, or server timestamp as source of truth (TBD).  

### Phase 2b (optional, after sync)

- **Capacitor local notifications** on native install, or  
- **Web Push / FCM** via Supabase Edge Function when `next_dose_at` is due  

### References when starting Phase 2

- [Supabase Auth](https://supabase.com/docs/guides/auth)  
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)  
- [Supabase + Vite env vars](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)  

---

## Tech stack

- React 19 + TypeScript  
- Vite 8  
- CSS (no component library)  
- `localStorage` persistence (Phase 1)  

## Project structure

```text
src/
  App.tsx                 # Layout + tab navigation
  context/
    TrackerContext.tsx    # State + localStorage (Phase 2: + Supabase)
  components/
    ChildProfiles.tsx
    QuickLog.tsx
    MedicationScheduler.tsx
    HealthTimeline.tsx
    HealthAnalytics.tsx
    BackupRestore.tsx
  types.ts
```

---

## License

Private project.

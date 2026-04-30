## Zyra Monorepo

Zyra now has:

- `.` (root): existing Next.js web app (unchanged runtime behavior)
- `mobile/`: Expo React Native app
- `shared/`: shared TypeScript logic (types/constants/helpers only)

Auth, onboarding, and profile checks for web are documented in [docs/validation-checklist.md](docs/validation-checklist.md).

## Run Web (Next.js)

From repo root:

```bash
npm install
npm run dev:web
```

Or run directly with the existing script:

```bash
npm run dev
```

Web runs at [http://localhost:3000](http://localhost:3000).

## Run Mobile (Expo)

From repo root:

```bash
npm run dev:mobile
```

Or directly in the app:

```bash
cd mobile
npm install
npm run start
```

Then choose iOS / Android / web from Expo.

## Shared Package Notes

- Shared code lives in `shared/src`
- Intended for safe cross-platform reuse:
  - data types
  - API response interfaces
  - constants
  - DoctorMatch helper types
  - Supabase public env normalization helper
- UI components and route-level logic stay app-specific for now

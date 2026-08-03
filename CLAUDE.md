# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Scholtz Scholar Service — a scholar (school transport) management app. Owners register scholars and drivers and handle invoicing; drivers tap pickup/drop-off events; parents/guardians never log in anywhere and are reached only via WhatsApp notifications. The authoritative product spec is `Scholar_Transport_App_Vision_Rev 8.docx` at the repo root (`Rev 1`–`Rev 7` are superseded drafts, kept for history only).

Two independently deployed apps in one repo, sharing a single Neon Postgres database:

- `frontend/` — React 19 + Vite + React Router, deployed to Vercel
- `backend/` — Express + Prisma, deployed to Render

## Commands

### Frontend (run from `frontend/`)

```
npm run dev      # Vite dev server on :5173
npm run build    # production build
npm run lint     # oxlint
```

Needs `frontend/.env.local` with `VITE_API_URL` pointing at the backend (defaults to `http://localhost:4000` in code if unset — see `frontend/src/lib/api.js`).

### Backend (run from `backend/`)

```
npm run dev              # nodemon src/server.js on :4000
npm start                # node src/server.js (no reload)
npm run seed              # wipes and reseeds demo data (backend/prisma/seed.js)
npm run prisma:migrate    # create + apply a migration
npm run prisma:studio     # Prisma Studio GUI
```

Needs `backend/.env` (gitignored, copy from `.env.example`): `DATABASE_URL` (Neon Postgres), `JWT_SECRET`, `PORT`.

There is no test suite in either package currently.

### Deploying

Backend auto-deploys on push to `main` via Render's Blueprint (`render.yaml` at repo root, `rootDir: backend`). Frontend does **not** auto-deploy from git — push to GitHub for history, but ship it explicitly:

```
cd frontend
vercel deploy --prod --yes
vercel alias set <new-deployment-url> scholtz-scholar-service.vercel.app
```

The second command is not optional: `scholtz-scholar-service.vercel.app` is a manually-pointed alias, not a registered Vercel "Production Domain," so it does **not** follow new deploys automatically. Skipping the `alias set` step leaves the clean URL serving a stale build while the deploy silently succeeds. (The other auto-generated `frontend-*.vercel.app` alias does update on its own — it's the leftover from before the project was renamed.)

## Architecture

**Local dev and production share one database.** `backend/.env`'s `DATABASE_URL` and Render's environment variable are the same Neon connection string. Running `npm run seed` locally wipes and reseeds the data everyone sees, including production. There's no separate local/staging DB.

**Auth: phone + password, JWT-based, with role switching.** One person's phone can hold an Owner account, a Driver account, or both (see `POST /api/owners` and `POST /api/auth/first-owner`'s `alsoDrives` handling in `backend/src/routes/owners.js` / `auth.js` — the linked driver record shares the owner's phone and password hash). `POST /api/auth/login` resolves to one role automatically, or returns a `roles` array for the client to disambiguate (`ContinueAsScreen`). An already-authenticated session can call `POST /api/auth/switch-role` to flip between its own linked roles without re-entering a password — the existing JWT already proves phone ownership, and the backend re-verifies the target role exists before issuing a new token. The JWT payload carries `availableRoles` so the frontend knows whether to show the switch button without an extra request.

**Enum casing is normalized in exactly one place.** Prisma/Postgres uses uppercase enums (`FULL`, `HOME_PICKUP`, `WHATSAPP`, `PARENT`...); the frontend (screens and `frontend/src/lib/selectors.js`) was built against lowercase string constants and expects that shape everywhere. `frontend/src/state/AppContext.jsx`'s `normalizeGuardian` / `normalizeScholar` / `normalizeTripEvent` are the only place this conversion happens. Any new field that needs to reach a screen has to be added there, or it'll leak the raw uppercase Prisma value into the UI.

**Guardian identity vs. notify preference are different tables on purpose.** A `Guardian` row is a contact identity shared across siblings (this is what makes invoice bundling and WhatsApp free-session-window tracking work correctly — see `resolveGuardianLinks` in `backend/src/routes/scholars.js`). The pickup/drop-off notify toggle is *not* on `Guardian`; it's on `GuardianLink` (the scholar↔guardian join), because the same contact can want updates for one child and not another.

**Notifications are stubbed behind one swappable file.** `backend/src/lib/notificationService.js` is a verbatim port of the project's original notification spec (hard opt-in gate, independent free-session-window cost optimization — read the file header comment before touching the logic). It's wired to `backend/src/lib/whatsappClient.js`, which just `console.log`s instead of calling the real WhatsApp Business API / Twilio. Swap only that one file when real credentials exist; nothing else should need to change.

**No global invoice list.** Invoices are always fetched per-family (`GET /api/invoices/family/:billingGuardianId`) or per-id — never as a flat collection loaded up front. `GenerateInvoiceScreen` / `InvoiceHistoryScreen` / `InvoiceDetailScreen` fetch on demand rather than reading from `AppContext`'s preloaded state, unlike scholars/drivers/guardians/schools which *are* eagerly loaded on login (`loadCoreData` in `AppContext.jsx`).

**Route protection.** `frontend/src/state/RequireRole.jsx` gates the `/owner/*` and `/driver/*` subtrees based on the current session's role; `frontend/src/App.jsx` is the single route tree definition. `frontend/vercel.json`'s rewrite (`/(.*) -> /index.html`) is required for this client-side routing to survive a direct URL load or page refresh on Vercel — without it, any nested route 404s.

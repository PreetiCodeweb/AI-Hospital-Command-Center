# Fixes Applied

**Date:** 2026-09-02  
**Branch:** `main`

## Phase 1 — audit and runtime

- Added `CODEBASE_AUDIT.md` with repository structure, architecture diagram, stack, route/API map, git chronology, and runtime findings.
- Added `FRONTEND_ISSUES.md` with severity-ranked frontend findings.
- Restored `backend/app/core/config.py` deleted by the latest commit.
- Restored injury detection UI and styling deleted by the latest commit.
- Added reproducible PostgreSQL initialization to `docker-compose.yml`, including schema, seed, views, orders/reviews migration, and order-details migration.
- Added order migration `dbms/migrations/004_add_order_details.sql` and included it in `dbms/Dockerfile`.

## Authentication and identity

- JWTs now include a `role` claim and login response includes the role.
- Login records `last_login_at` and frontend redirects administrators to `/admin`, regular users to `/dashboard`.
- Authenticated shell restores `/auth/me`, blocks unauthenticated access behind the login screen, and exposes logout.
- Sidebar, topbar, and profile drawer now use the authenticated user's actual name, email, and role instead of hard-coded Admin User values.
- Profile display-name save now calls `PATCH /api/v1/auth/me`.
- Admin seeding is idempotent and reads `ADMIN_PASSWORD` only from environment/secrets. The requested six-character credential is not committed to source.
- Replaced Passlib's noisy bcrypt backend probe with the pinned `bcrypt` API while preserving bcrypt-compatible hashes.
- Standardized the minimum password length to 6 characters across login UI, registration, admin-created users, and password changes; the 72-byte bcrypt maximum remains enforced.

## Admin and bed orders

- Added typed frontend domain contracts in `frontend/types/index.ts` for users, patients, beds, staff, alerts, orders, summaries, and command-center state.
- Added public authenticated `POST /api/v1/orders`.
- Added `bed_type` and validated `quantity` to order requests/responses and ORM model.
- Added admin-only `GET /api/v1/admin/users`, `GET /api/v1/admin/orders`, and `PATCH /api/v1/admin/orders/{id}` with status validation.
- Admin UI now loads typed users/orders/reviews, filters users by name/email, shows registration dates, and updates order status in the database.
- Added live Resources page flow for ICU inventory and request submission with loading, success, and error states.

## Injury detection and homepage

- Restored the scanner component with upload and guided simulation flows, file validation, loading/error states, and clinical-review disclaimer.
- Homepage now renders the checked-in `frontend/public/hospital.webp` asset in the Northstar Medical Center hero.
- Normalized visible branding from `MediNexus` to `MedSync`.
- The homepage uses a performant static visual fallback rather than adding a new Three.js dependency to the existing large client bundle; this is the lighter fallback explicitly allowed by the requirement.

## API client and tooling

- Centralized safe API error parsing with `ApiError`, request timeout, bearer-token attachment, and consistent JSON handling.
- Standardized forecast, dashboard, and simulation service paths under `/api/v1`.
- Added a pinned supported ESLint toolchain and `eslint-config-next`, configured the existing lint command as `eslint .`, and excluded generated `.next` artifacts.
- Updated stale frontend architecture documentation to match the actual FastAPI/PostgreSQL system.

## Verification

- `npm run lint`: passes with 0 warnings/errors.
- `npm run build`: passes with strict TypeScript checking.
- `npx tsc --noEmit`: run as final verification.
- `PYTHONPATH=backend .venv/bin/pytest -q backend/tests`: 6 passed.
- `PYTHONPATH=backend .venv/bin/python -m compileall -q backend/app`: passes.
- `npm audit --omit=dev --audit-level=high`: reports unresolved high-severity advisories in Next.js transitive `postcss`/`sharp`; the available fix forces a breaking Next 16 upgrade and was not applied without compatibility testing.
- Backend live checks passed on `http://127.0.0.1:8000`: health, login with role claim, dashboard, beds, order creation, order status update.
- Frontend live checks passed on `http://127.0.0.1:3000`: HTTP 200 and same-origin API proxy to dashboard.

## Local run

Docker Compose is defined in `docker-compose.yml`. This machine has Docker/Colima but does not have the Compose plugin, so validation used an equivalent PostgreSQL container plus local Uvicorn/Next processes.

With Docker Compose available:

```bash
export ADMIN_PASSWORD='428570'   # local secret only; do not commit
export SECRET_KEY="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
docker compose up --build
```

Then open `http://localhost:3000` and log in with:

- email: `roselyn_yu@northstar.example`
- password: the value supplied through `ADMIN_PASSWORD` (`428570` for the requested local credential)

The seeded database uses PostgreSQL; no in-memory or mock database is used for the live order and inventory paths.

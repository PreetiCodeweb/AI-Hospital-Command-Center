# AI Hospital Command Center — Codebase Audit

**Audit date:** 2026-09-02  
**Branch:** `main` (`1ed2798`)  
**Repository:** `https://github.com/PreetiCodeweb/AI-Hospital-Command-Center`

## Executive summary

The repository is a Next.js/React frontend paired with a FastAPI/SQLAlchemy backend and PostgreSQL schema. The UI is primarily a polished prototype: many dashboard metrics, charts, departments, recommendations, and resource values are hard-coded in `frontend/app/App.tsx`, while the backend exposes a partial live API. The latest commit deleted `backend/app/core/config.py`, `backend/app/schemas/injury_schemas.py`, and `frontend/components/InjuryScanner.tsx` plus related styling; the current `App.tsx` still imports `InjuryScanner`, so the frontend cannot compile from the checked-out commit.

## Architecture

```text
Browser :3000
  │ Next.js App Router / client-side path router
  │ localStorage Bearer token + same-origin /api rewrite
  ▼
Next.js rewrite (/api/*)
  │ BACKEND_URL (default http://localhost:8000)
  ▼
FastAPI :8000 (/api/v1/*)
  ├─ auth: register/login/me/admin user management
  ├─ dashboard: department snapshot
  ├─ operations: beds/staff/equipment/resources/digital-twin,
  │              injury-analysis, alerts, recommendations, uploads
  ├─ forecast: ML-backed forecast endpoints
  └─ simulations: surge simulation endpoint
  │ SQLAlchemy + psycopg
  ▼
PostgreSQL :5433 local / :5432 container
  ├─ migrations/001_initial_schema.sql
  ├─ migrations/002_enable_existing_user_login.sql
  └─ migrations/003_add_bed_orders_and_reviews.sql
```

## Repository layout

| Path | Responsibility |
|---|---|
| `frontend/` | Next.js 15, React 19, TypeScript UI and service modules |
| `frontend/app/App.tsx` | Large client-side command-center shell and most prototype pages |
| `frontend/components/` | Auth, injury scanner (deleted in latest commit), simulator, digital twin, settings, error boundary |
| `frontend/*Service.ts` | Thin fetch wrappers for backend endpoints |
| `backend/app/api/routes/` | FastAPI route modules |
| `backend/app/models/` | SQLAlchemy ORM models |
| `backend/app/schemas/` | Pydantic request/response schemas |
| `backend/app/services/` | Seed, forecast, simulation, optimization, recommendations |
| `backend/app/ml/` | Forecasting data/model utilities |
| `dbms/migrations/` | PostgreSQL schema and incremental SQL changes |
| `dbms/seeds/` | Demo PostgreSQL data |
| `dbms/views/` | Reporting views |
| `k8s/` | Kubernetes manifests for PostgreSQL, backend, frontend |
| `docker-compose.yml` | Local PostgreSQL only |
| `docker-compose.production.yml` | Image-based full stack, currently comments out source-build services |

## Technology inventory

- **Frontend:** Next.js `15.1.x`, React `19`, TypeScript `5.7`, Tailwind configured but UI primarily uses CSS, `framer-motion`, `lucide-react`, `recharts`.
- **State:** React local state (`useState`, `useEffect`, `useMemo`); no Redux/Zustand/React Query/SWR.
- **Routing:** Next catch-all pages plus a custom `history.pushState` router inside `App.tsx`.
- **API client:** native `fetch` in `frontend/apiClient.ts`; localStorage Bearer token; Next rewrite for `/api/*`.
- **Authentication:** FastAPI OAuth2 form login, bcrypt via Passlib, JWT via `python-jose`; frontend stores token in localStorage.
- **Backend:** FastAPI, SQLAlchemy 2, Pydantic v2, psycopg 3, pandas/numpy/scikit-learn/joblib.
- **Database:** PostgreSQL 16 schema with pgcrypto/citext, UUIDs, enums, hospitals, departments, users, beds, patients, admissions, staff, equipment, metrics, alerts, orders, reviews.
- **Deployment:** Dockerfiles and Kubernetes YAML; local compose currently provisions only PostgreSQL.

## Data flow and route map

| UI route | Current implementation | Intended/live API |
|---|---|---|
| `/` | Hard-coded home/hero metrics | No live request |
| `/dashboard` | Hard-coded dashboard metrics, alerts, charts, departments | `GET /api/v1/dashboard` exists but is not wired into the page |
| `/resources` | Hard-coded resource table and local approval state | `GET /api/v1/resources` exists; bed order POST is not wired |
| `/forecast` | Hard-coded chart and risk cards | `GET/POST /api/v1/forecast` exist; page is not wired |
| `/simulator` | `components/SurgeSimulator.tsx` | `POST /api/v1/simulations` wrapper exists; component needs contract verification |
| `/digital-twin` | `DigitalTwinGraph` | `GET /api/v1/digital-twin` exists; page needs live wiring |
| `/injury-detection` | Imports `InjuryScanner` | Broken at current HEAD because component was deleted; prior scanner used upload/simulate APIs |
| `/recommendations` | Hard-coded recommendation cards | `GET /api/v1/recommendations` exists; page is not wired |
| `/departments/:slug` | Hard-coded department workspace | No department-specific frontend API flow |
| Admin UI | `AdminUsers` component exists separately | `/api/v1/auth/users`, `/api/v1/admin/bed-orders`, `/api/v1/admin/reviews`; no dedicated route/visible navigation wiring found |

## Runtime baseline

- `npm install` completed in `frontend/`; npm reported 3 high-severity dependency audit findings and a deprecated Recharts 2 branch. No dependency upgrade was applied blindly.
- Python setup was started using a local `.venv` and `backend/requirements.txt`.
- `docker compose config` could not run because this environment has Docker CLI without the Compose subcommand/plugin (`docker: unknown command: docker compose`). The PostgreSQL service remains the documented local dependency.
- Initial backend import/startup was blocked by the deleted `backend/app/core/config.py`; the file was restored and the service now starts on port 8000.
- Initial frontend build was blocked by the deleted `frontend/components/InjuryScanner.tsx` import and stylesheet; both were restored and the build now passes.

## Git history findings

The history contains parallel/duplicate merge-line commits and rapid feature changes from 2026-08-25 through 2026-09-02. Relevant chronology:

1. Initial frontend/backend/database scaffolding.
2. API integration and deployment manifests.
3. Auth schema, email verification, and local login changes.
4. Hospital image and ICU bed-order feature (`78069ae`).
5. Admin bed-order/review dashboard (`9bcefe1`).
6. Injury detection service exports and scanner (`322cc59`).
7. Backend config/auth/operations updates (`474528c`).
8. Latest commit `1ed2798` deletes config, injury schemas, scanner, and styles, leaving a stale import in `App.tsx`.

## Main risk summary

- **P0:** frontend compile failure due stale deleted `InjuryScanner` import; backend cannot import due deleted config.
- **P0:** database initialization is not part of local `docker-compose.yml`; backend cannot run against a clean local PostgreSQL unless schema/seeds are applied manually.
- **P1:** login JWT has no `role` claim; user/admin routing is not role-driven. Admin API exists but admin component is not integrated into the shell/navigation.
- **P1:** UI data is mostly static and does not reflect registrations, user profile changes, bed mutations, dashboard changes, or alerts.
- **P1:** bed order model/API only supports one bed UUID and lacks quantity/explicit status transition endpoint; frontend order buttons are absent/not connected.
- **P1:** `seed_demo()` is a no-op; requested admin account is not seeded by application setup.
- **P1:** injury scanner was deleted in the latest commit; previous implementation used simulated findings and a real upload flow.
- **P2:** localStorage JWT is vulnerable to XSS token theft compared with an httpOnly cookie; no brute-force/rate limiting is present.
- **P2:** no centralized typed API error model, retry policy, cache invalidation, loading skeleton strategy, or page-level data error UX.
- **P2:** duplicate service paths and stale `ARCHITECTURE.md` document Java/Oracle/mock architecture inconsistent with the actual FastAPI/PostgreSQL implementation.

# Frontend Audit — MedSync

**Audit date:** 2026-09-02  
**Scope:** `frontend/` and frontend/backend contract points

| # | File | Issue Type | Severity | Description | Fix Plan |
|---:|---|---|---|---|---|
| 1 | `app/App.tsx`, `components/InjuryScanner.tsx` | Build / broken flow | P0 | `App.tsx` imports `InjuryScanner`, but latest commit deleted the component. Injury Detection route cannot compile. | Restore scanner component and preserve upload/simulate backend flow. |
| 2 | `backend/app/core/config.py` import path | Build / runtime | P0 | Backend config file was deleted in latest commit while `main.py`, database session, security, and tests import it. | Restore settings module with safe local defaults and env overrides. |
| 3 | `docker-compose.yml` | Local runtime | P0 | Compose provisions only PostgreSQL; no backend/frontend services, migrations, or seeds. | Make local startup reproducible with schema initialization and documented backend/frontend commands; avoid destructive volume reset. |
| 4 | `app/App.tsx` | Data correctness | P1 | Home/dashboard/resources/forecast/recommendations are mostly hard-coded and never consume live API responses. | Add typed service calls, loading/error states, and use live data with safe fallback only where contract is unavailable. |
| 5 | `authService.ts`, `AuthExperience.tsx` | Auth flow | P1 | Login stores token but does not fetch role during login response or route based on role. Admin access is not integrated into navigation/route guard. | Return role in JWT/response, load `/me`, guard admin UI, and provide logout/session restoration. |
| 6 | `apiClient.ts` | Security / resilience | P1 | Token is stored in localStorage, no timeout/retry/status normalization, and errors expose raw response text. | Add typed API errors, abort timeout, bounded retry for idempotent requests, and consistent safe error extraction. Keep storage compatibility unless cookie migration is implemented end-to-end. |
| 7 | `components/AuthExperience.tsx` | TypeScript | P1 | Uses `any[]` for bed orders/reviews and untyped API responses. | Add shared typed domain models and typed admin responses. |
| 8 | `components/AuthExperience.tsx` | State / UX | P1 | `Promise.all` loader allows independent loaders to overwrite shared error; no retry button or empty/loading skeleton; stale admin data can remain after mutations. | Use a single typed loader, explicit error state, refresh action, and refetch after mutations. |
| 9 | `app/App.tsx` | User identity | P1 | Sidebar, topbar, profile drawer, and forms display hard-coded `Admin User` and `admin@northstarmedical.example`; profile save only sets local `saved`. | Pass authenticated user through shell and call `PATCH /auth/me`; render returned name/email/role. |
| 10 | `app/App.tsx` / resources | Bed orders | P1 | The current `ResourcesPage` has no order/request button or backend mutation, despite backend order routes existing. | Add typed order request UI and backend contract supporting department, bed type, quantity, status. |
| 11 | `components/AuthExperience.tsx` / backend | Admin contract | P1 | Admin dashboard only has `/api/v1/auth/users`, `/admin/bed-orders`, `/admin/reviews`; requested `/admin/users`, `/admin/orders`, status PATCH are missing. | Add compatibility endpoints or migrate UI to the existing contract; implement status transition with validation/audit semantics. |
| 12 | `frontend/app/App.tsx` | Routing | P1 | Custom `history.pushState` routing duplicates Next routing and can produce inconsistent navigation/refresh behavior. | Preserve current UX short-term but centralize route handling; use Next route semantics for new protected routes. |
| 13 | `frontend/app/App.tsx` | Performance | P2 | One 3,500-line client bundle imports charts, motion, and all pages/components eagerly. | Split heavy routes/components with dynamic imports after functional wiring. |
| 14 | `frontend/app/App.tsx` | UX / accessibility | P2 | Many action buttons are visual-only; no disabled/loading feedback, and hard-coded dashboard has no API error/empty states. | Connect actions or label unavailable actions; add accessible busy/error/empty states. |
| 15 | `frontend/app/App.tsx` | Homepage | P1 | `public/hospital.webp` exists but is never referenced; hero uses an icon-only building illustration. MedSync branding is text/icon only and inconsistent with `MediNexus`. | Render the asset with `next/image` or a reliable `<img>` fallback, add consistent MedSync brand mark/name. |
| 16 | `frontend/injuryDetectionService.ts`, deleted scanner | Broken feature | P1 | Service exports upload/simulate functions but UI component was removed. Backend response differs between endpoints and lacks a common schema/disclaimer. | Restore scanner and normalize response types/handling; show API errors and clinical disclaimer. |
| 17 | `frontend/*Service.ts` | API contract | P1 | Several paths are stale (`/api/dashboard`, `/api/simulations`, `/api/forecast`) and rely on rewrites accidentally; services lack return types. | Standardize `/api/v1` paths and typed response contracts. |
| 18 | `frontend/app/layout.tsx` | Security / maintainability | P2 | Inline `dangerouslySetInnerHTML` theme bootstrap parses localStorage and silently swallows all errors. | Keep minimal bootstrap if needed, validate parsed shape and avoid broad silent catch; no user-controlled HTML is rendered. |
| 19 | `components/ErrorBoundary.tsx` | Observability | P2 | Error boundary exists but is not visibly wrapped around the application in the inspected shell. | Wrap app shell and preserve a recovery action without exposing stack traces. |
| 20 | `frontend/package.json` | Dependency health | P2 | npm install reports 3 high-severity vulnerabilities and Recharts 2 deprecation warning. | Inspect `npm audit`; upgrade only compatible, vetted versions, avoiding blind `--force`. |
| 21 | `app/App.tsx` | Accessibility | P2 | Numerous icon-only controls lack visible labels/tooltips; tables and custom interactive rows need keyboard/semantic review. | Add `aria-label`, semantic buttons/links, focus states, and keyboard tests. |
| 22 | `app/App.tsx` | State freshness | P2 | Dashboard refresh button has no handler; displayed “live” timestamp and metrics never update. | Wire refresh to dashboard query/refetch and show last successful update/error. |
| 23 | `authService.ts` | Auth UX | P1 | Logout makes a fire-and-forget request and clears local storage, but shell has no logout action or redirect. | Add explicit logout action, clear session, navigate to login, handle backend response safely. |
| 24 | `components/AuthExperience.tsx` | Data visibility | P1 | Registered users can appear in admin only after mount; no search/filter despite requirement. | Add debounced client filter now and server pagination contract when needed. |

## Remediation status

P0 build blockers and the reported P1 regressions were fixed: missing injury scanner/style restoration, visible homepage image, MedSync branding, authenticated identity rendering, live ICU inventory/order creation, admin order status updates, typed admin data, and auth role routing. The remaining P2 items are documented trade-offs or legacy presentation surfaces; the static fallback was intentionally retained instead of adding a new 3D dependency to the existing large client bundle.

## Confirmed frontend root causes

1. **Injury detection regression:** the latest commit deleted `InjuryScanner.tsx` but left the import and API service. This is a deterministic build failure, not a backend ML failure.
2. **Homepage image regression:** `hospital.webp` is present in `frontend/public/` but no source reference exists, so it cannot render.
3. **Identity regression:** authenticated identity is only fetched inside `AdminUsers`; the main shell uses literals, so registration/login cannot change the visible name.
4. **Backend disconnection:** service wrappers exist, but most page components render local constants and local state rather than calling them.
5. **Admin order gap:** backend order creation requires a bed UUID and department UUID but does not expose the requested quantity/bed-type workflow or status mutation.

## Security notes

- No API key was found in the inspected frontend source. `NEXT_PUBLIC_*` values are public by design and must not carry secrets.
- `dangerouslySetInnerHTML` is used only for a static theme bootstrap string; it should remain free of user/API content.
- localStorage bearer tokens are a known XSS exposure. A production deployment should migrate to secure, httpOnly, SameSite cookies with CSRF protection; the current backend/frontend contract is bearer-token based, so this requires coordinated change.

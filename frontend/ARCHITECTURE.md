# MedSync frontend architecture

MedSync is a Next.js 15 / React 19 client for the FastAPI hospital operations API.

```text
Next.js App Router + client command-center shell
                 |
       native fetch API client
       (same-origin /api rewrite)
                 |
          FastAPI /api/v1
                 |
       SQLAlchemy + PostgreSQL
                 |
     forecasting and operations services
```

## Frontend boundaries

- `app/App.tsx` owns the authenticated shell and legacy command-center route presentation.
- `components/AuthExperience.tsx` owns login, registration, and admin operations.
- `components/ResourcesConnected.tsx` owns live bed inventory and ICU order submission.
- `components/InjuryScanner.tsx` owns the upload/simulated injury decision-support flow.
- `apiClient.ts` is the single fetch boundary and attaches the stored bearer token.
- `types/index.ts` contains shared frontend domain contracts.

## API contracts

- `GET /api/v1/dashboard`
- `GET /api/v1/beds`, `GET /api/v1/beds/{department_type}`
- `POST /api/v1/orders`
- `GET /api/v1/forecast/{department_type}`, `POST /api/v1/forecast`
- `POST /api/v1/simulations`
- `GET /api/v1/digital-twin`
- `POST /api/v1/injury-analysis/upload`, `POST /api/v1/injury-analysis/simulate`
- `GET /api/v1/recommendations`
- `GET/PATCH /api/v1/admin/users`, `/api/v1/admin/orders/{id}`

All clinical decision-support outputs are assistive and require authorized human review.

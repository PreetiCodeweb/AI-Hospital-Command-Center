# MedSync architecture

MedSync is currently a mock-data prototype with a replaceable service boundary.

```text
Next.js / React / TypeScript frontend
                |
         Java REST API layer
                |
          Oracle SQL database
                |
        Python AI / ML services
```

Planned AI services include demand forecasting, risk prediction, resource optimization, anomaly detection, simulation, computer vision analysis, and recommendation generation.

The prototype exposes the intended API contracts:

- `GET /api/dashboard`
- `GET /api/resources`
- `GET /api/forecast`
- `POST /api/simulations`
- `GET /api/digital-twin`
- `POST /api/injury-analysis`
- `GET /api/recommendations`

The current UI keeps operational recommendations human-reviewed and clearly labels injury analysis as decision-support only.

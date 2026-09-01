# Hospital Command Center Database

PostgreSQL schema, migrations, seed data, and reporting views for the AI Hospital Command Center.

## Structure

- `migrations/001_initial_schema.sql` - extensions, enums, tables, constraints, indexes, and update triggers
- `seeds/001_demo_data.sql` - deterministic, de-identified demo data for local development
- `views/001_command_center_views.sql` - operational dashboard views and helper functions
- `docker-compose.yml` - disposable local PostgreSQL instance

The schema includes the normalized operational tables plus the compatibility
fields currently queried by the FastAPI routes (`departments.type`, `beds.id`,
`staff.on_shift`, `equipment.total_units`, `equipment.in_use_units`, and
`alerts.created_at`). `historical_metrics` is the forecasting and dataset-upload
contract used by the ML service.

## Run locally

From the repository root:

```bash
docker compose -f dbms/docker-compose.yml up -d
psql postgresql://hospital:hospital_dev_password@localhost:5433/hospital_command_center \
  -f dbms/migrations/001_initial_schema.sql
psql postgresql://hospital:hospital_dev_password@localhost:5433/hospital_command_center \
  -f dbms/seeds/001_demo_data.sql
psql postgresql://hospital:hospital_dev_password@localhost:5433/hospital_command_center \
  -f dbms/views/001_command_center_views.sql
```

The database listens on port `5433` to avoid colliding with a local PostgreSQL installation. The demo credentials are for local development only.

Demo login accounts use the password `demo123`:

- `admin@northstar.example`
- `ops@northstar.example`
- `admin.east@northstar.example`

Start the backend with `DATABASE_URL` pointed at the same database. The
forecasting service can use the seeded 60 days of hourly history immediately;
uploaded CSV/XLSX files must include `timestamp` and `department_type`.

## Design notes

- UUID primary keys are used so services can create identifiers without coordination.
- Patient records contain only synthetic identifiers and operational demographics. Do not place real PHI in seeds or development environments.
- Timestamps use `TIMESTAMPTZ` and are stored in UTC.
- `audit_logs` records changes to sensitive operational entities; application services should write the actor and request metadata.
- Forecasts, alerts, and recommendations are separate records so predictions remain traceable and can be reviewed after an operational decision.

## Useful queries

```sql
SELECT * FROM command_center_overview;
SELECT * FROM department_operational_status ORDER BY risk_level DESC;
SELECT * FROM active_alerts ORDER BY severity DESC, started_at;
SELECT * FROM upcoming_demand_forecast ORDER BY forecast_for;
SELECT department_type, COUNT(*) FROM historical_metrics GROUP BY department_type;
```

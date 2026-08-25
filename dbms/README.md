# Hospital Command Center Database

PostgreSQL schema, migrations, seed data, and reporting views for the AI Hospital Command Center.

## Structure

- `migrations/001_initial_schema.sql` - extensions, enums, tables, constraints, indexes, and update triggers
- `seeds/001_demo_data.sql` - deterministic, de-identified demo data for local development
- `views/001_command_center_views.sql` - operational dashboard views and helper functions
- `docker-compose.yml` - disposable local PostgreSQL instance

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
```

FROM postgres:16-alpine

COPY ./migrations/001_initial_schema.sql /docker-entrypoint-initdb.d/001_initial_schema.sql
COPY ./seeds/001_demo_data.sql /docker-entrypoint-initdb.d/002_demo_data.sql
COPY ./views/001_command_center_views.sql /docker-entrypoint-initdb.d/003_command_center_views.sql
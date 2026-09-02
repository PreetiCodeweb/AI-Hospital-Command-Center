FROM postgres:16-alpine

COPY ./migrations/001_initial_schema.sql /docker-entrypoint-initdb.d/001_initial_schema.sql
COPY ./seeds/001_demo_data.sql /docker-entrypoint-initdb.d/002_demo_data.sql
COPY ./views/001_command_center_views.sql /docker-entrypoint-initdb.d/003_command_center_views.sql
COPY ./migrations/003_add_bed_orders_and_reviews.sql /docker-entrypoint-initdb.d/004_add_bed_orders_and_reviews.sql
COPY ./migrations/004_add_order_details.sql /docker-entrypoint-initdb.d/005_add_order_details.sql
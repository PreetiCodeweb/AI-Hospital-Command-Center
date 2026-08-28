BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE user_role AS ENUM ('system_admin', 'hospital_admin', 'doctor', 'nurse', 'operations_manager');
CREATE TYPE staff_type AS ENUM ('doctor', 'nurse', 'technician', 'paramedic', 'administrator', 'support');
CREATE TYPE staff_status AS ENUM ('active', 'on_leave', 'inactive');
CREATE TYPE bed_type AS ENUM ('general', 'icu', 'emergency', 'isolation', 'surgical', 'pediatric');
CREATE TYPE bed_status AS ENUM ('available', 'occupied', 'cleaning', 'maintenance', 'blocked', 'discharge_pending');
CREATE TYPE admission_type AS ENUM ('emergency', 'elective', 'transfer', 'observation');
CREATE TYPE admission_status AS ENUM ('registered', 'admitted', 'discharged', 'cancelled');
CREATE TYPE triage_level AS ENUM ('resuscitation', 'emergency', 'urgent', 'semi_urgent', 'non_urgent');
CREATE TYPE equipment_status AS ENUM ('available', 'in_use', 'maintenance', 'out_of_service', 'retired');
CREATE TYPE prediction_type AS ENUM ('admissions', 'bed_demand', 'icu_occupancy', 'emergency_inflow', 'staff_requirement', 'equipment_utilization');
CREATE TYPE risk_level AS ENUM ('normal', 'watch', 'high', 'critical');
CREATE TYPE alert_status AS ENUM ('open', 'acknowledged', 'resolved', 'dismissed');
CREATE TYPE recommendation_status AS ENUM ('proposed', 'approved', 'in_progress', 'completed', 'rejected');
CREATE TYPE allocation_status AS ENUM ('planned', 'approved', 'active', 'completed', 'cancelled');
CREATE TYPE department_type AS ENUM ('ICU', 'EMERGENCY', 'WARD', 'OPERATING_ROOM', 'ISOLATION');

CREATE TABLE hospitals (
    hospital_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(160) NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    address TEXT,
    phone VARCHAR(40),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE departments (
    department_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(hospital_id),
    name VARCHAR(120) NOT NULL,
    code VARCHAR(30) NOT NULL,
    department_type department_type NOT NULL,
    type department_type NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 0 CHECK (capacity >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (hospital_id, code),
    UNIQUE (hospital_id, name)
);

CREATE TABLE app_users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospitals(hospital_id),
    email CITEXT NOT NULL UNIQUE,
    full_name VARCHAR(160) NOT NULL,
    role user_role NOT NULL,
    password_hash TEXT NOT NULL,
    hashed_password TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE patients (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(hospital_id),
    medical_record_number VARCHAR(40) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    date_of_birth DATE NOT NULL CHECK (date_of_birth <= CURRENT_DATE),
    sex_at_birth VARCHAR(20),
    postal_code VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (hospital_id, medical_record_number)
);

CREATE TABLE staff (
    staff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(hospital_id),
    department_id UUID REFERENCES departments(department_id),
    employee_code VARCHAR(40) NOT NULL,
    full_name VARCHAR(160) NOT NULL,
    staff_type staff_type NOT NULL,
    specialty VARCHAR(100),
    status staff_status NOT NULL DEFAULT 'active',
    on_shift BOOLEAN NOT NULL DEFAULT FALSE,
    hire_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (hospital_id, employee_code)
);

CREATE TABLE staff_shifts (
    shift_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(staff_id),
    department_id UUID NOT NULL REFERENCES departments(department_id),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL CHECK (ends_at > starts_at),
    role_on_shift VARCHAR(80),
    patient_load INTEGER NOT NULL DEFAULT 0 CHECK (patient_load >= 0),
    is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE beds (
    bed_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id UUID GENERATED ALWAYS AS (bed_id) STORED UNIQUE,
    department_id UUID NOT NULL REFERENCES departments(department_id),
    bed_number VARCHAR(20) NOT NULL,
    bed_type bed_type NOT NULL,
    status bed_status NOT NULL DEFAULT 'available',
    floor VARCHAR(20),
    is_monitoring_capable BOOLEAN NOT NULL DEFAULT FALSE,
    last_cleaned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (department_id, bed_number)
);

CREATE TABLE admissions (
    admission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id),
    department_id UUID NOT NULL REFERENCES departments(department_id),
    bed_id UUID REFERENCES beds(bed_id),
    admission_type admission_type NOT NULL,
    status admission_status NOT NULL DEFAULT 'registered',
    triage_level triage_level,
    admitted_at TIMESTAMPTZ NOT NULL,
    expected_discharge_at TIMESTAMPTZ,
    discharged_at TIMESTAMPTZ,
    chief_complaint TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (expected_discharge_at IS NULL OR expected_discharge_at >= admitted_at),
    CHECK (discharged_at IS NULL OR discharged_at >= admitted_at)
);

CREATE TABLE bed_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bed_id UUID NOT NULL REFERENCES beds(bed_id),
    admission_id UUID NOT NULL REFERENCES admissions(admission_id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    released_at TIMESTAMPTZ,
    CHECK (released_at IS NULL OR released_at >= assigned_at)
);
CREATE UNIQUE INDEX one_active_assignment_per_bed ON bed_assignments (bed_id) WHERE released_at IS NULL;
CREATE UNIQUE INDEX one_active_bed_per_admission ON bed_assignments (admission_id) WHERE released_at IS NULL;

CREATE TABLE equipment_types (
    equipment_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(60) NOT NULL,
    requires_calibration BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE equipment (
    equipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(hospital_id),
    department_id UUID REFERENCES departments(department_id),
    equipment_type_id UUID NOT NULL REFERENCES equipment_types(equipment_type_id),
    name VARCHAR(100),
    total_units INTEGER NOT NULL DEFAULT 1 CHECK (total_units >= 0),
    in_use_units INTEGER NOT NULL DEFAULT 0 CHECK (in_use_units >= 0 AND in_use_units <= total_units),
    asset_tag VARCHAR(50) NOT NULL,
    status equipment_status NOT NULL DEFAULT 'available',
    serial_number VARCHAR(100),
    last_service_at TIMESTAMPTZ,
    next_service_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (hospital_id, asset_tag),
    CHECK (next_service_at IS NULL OR last_service_at IS NULL OR next_service_at >= last_service_at)
);

CREATE TABLE equipment_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES equipment(equipment_id),
    recorded_by UUID REFERENCES app_users(user_id),
    status equipment_status NOT NULL,
    utilization_percent NUMERIC(5,2) CHECK (utilization_percent BETWEEN 0 AND 100),
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE supplies (
    supply_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(hospital_id),
    department_id UUID REFERENCES departments(department_id),
    name VARCHAR(140) NOT NULL,
    sku VARCHAR(60) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    quantity_on_hand NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    reorder_threshold NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (reorder_threshold >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (hospital_id, sku)
);

CREATE TABLE emergency_events (
    emergency_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(hospital_id),
    department_id UUID REFERENCES departments(department_id),
    event_type VARCHAR(80) NOT NULL,
    severity risk_level NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    patient_count INTEGER NOT NULL DEFAULT 0 CHECK (patient_count >= 0),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE TABLE predictions (
    prediction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(hospital_id),
    department_id UUID REFERENCES departments(department_id),
    prediction_type prediction_type NOT NULL,
    forecast_for TIMESTAMPTZ NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    predicted_value NUMERIC(12,2) NOT NULL,
    lower_bound NUMERIC(12,2),
    upper_bound NUMERIC(12,2),
    confidence NUMERIC(5,4) CHECK (confidence BETWEEN 0 AND 1),
    model_version VARCHAR(80) NOT NULL,
    CHECK (lower_bound IS NULL OR upper_bound IS NULL OR lower_bound <= upper_bound)
);
CREATE INDEX predictions_lookup ON predictions (hospital_id, prediction_type, forecast_for DESC);

CREATE TABLE alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(hospital_id),
    department_id UUID REFERENCES departments(department_id),
    prediction_id UUID REFERENCES predictions(prediction_id),
    emergency_event_id UUID REFERENCES emergency_events(emergency_event_id),
    alert_type VARCHAR(80) NOT NULL,
    severity risk_level NOT NULL,
    status alert_status NOT NULL DEFAULT 'open',
    title VARCHAR(180) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES app_users(user_id),
    resolved_by UUID REFERENCES app_users(user_id),
    CHECK (resolved_at IS NULL OR resolved_at >= started_at)
);
CREATE INDEX active_alerts_lookup ON alerts (hospital_id, status, severity, started_at DESC);

CREATE TABLE recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(hospital_id),
    department_id UUID REFERENCES departments(department_id),
    alert_id UUID REFERENCES alerts(alert_id),
    title VARCHAR(180) NOT NULL,
    action TEXT NOT NULL,
    rationale TEXT,
    priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    status recommendation_status NOT NULL DEFAULT 'proposed',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by UUID REFERENCES app_users(user_id),
    reviewed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE TABLE resource_allocations (
    allocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(hospital_id),
    department_id UUID NOT NULL REFERENCES departments(department_id),
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    status allocation_status NOT NULL DEFAULT 'planned',
    reason TEXT NOT NULL,
    approved_by UUID REFERENCES app_users(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospitals(hospital_id),
    actor_user_id UUID REFERENCES app_users(user_id),
    entity_type VARCHAR(80) NOT NULL,
    entity_id UUID,
    action VARCHAR(40) NOT NULL,
    changes JSONB NOT NULL DEFAULT '{}'::jsonb,
    request_id VARCHAR(100),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_entity_lookup ON audit_logs (entity_type, entity_id, occurred_at DESC);

CREATE INDEX departments_hospital_idx ON departments (hospital_id);
CREATE INDEX staff_department_status_idx ON staff (department_id, status);
CREATE INDEX shifts_department_time_idx ON staff_shifts (department_id, starts_at, ends_at);
CREATE INDEX beds_department_status_idx ON beds (department_id, status);
CREATE INDEX admissions_active_idx ON admissions (department_id, status, admitted_at DESC) WHERE status IN ('registered', 'admitted');
CREATE INDEX equipment_department_status_idx ON equipment (department_id, status);
CREATE INDEX emergency_active_idx ON emergency_events (hospital_id, ended_at, started_at DESC);
CREATE INDEX recommendations_open_idx ON recommendations (hospital_id, status, priority);

CREATE TABLE historical_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_type department_type NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    arrivals INTEGER NOT NULL DEFAULT 0 CHECK (arrivals >= 0),
    admissions_count INTEGER NOT NULL DEFAULT 0 CHECK (admissions_count >= 0),
    occupied_beds INTEGER NOT NULL DEFAULT 0 CHECK (occupied_beds >= 0),
    total_beds INTEGER NOT NULL DEFAULT 0 CHECK (total_beds >= 0),
    staff_on_duty INTEGER NOT NULL DEFAULT 0 CHECK (staff_on_duty >= 0),
    equipment_in_use INTEGER NOT NULL DEFAULT 0 CHECK (equipment_in_use >= 0),
    equipment_total INTEGER NOT NULL DEFAULT 0 CHECK (equipment_total >= 0),
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    hour_of_day SMALLINT NOT NULL CHECK (hour_of_day BETWEEN 0 AND 23),
    is_holiday BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (department_type, timestamp)
);
CREATE INDEX historical_metrics_lookup ON historical_metrics (department_type, timestamp ASC);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER hospitals_updated_at BEFORE UPDATE ON hospitals FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER app_users_updated_at BEFORE UPDATE ON app_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER beds_updated_at BEFORE UPDATE ON beds FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER admissions_updated_at BEFORE UPDATE ON admissions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER supplies_updated_at BEFORE UPDATE ON supplies FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;

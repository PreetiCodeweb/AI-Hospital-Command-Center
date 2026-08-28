BEGIN;

-- Synthetic records only. These identifiers are safe for local development.
INSERT INTO hospitals (hospital_id, name, code, timezone, address, phone) VALUES
('00000000-0000-0000-0000-000000000001', 'Northstar General Hospital', 'NSGH', 'America/New_York', '100 Meridian Avenue', '+1-555-0100'),
('00000000-0000-0000-0000-000000000002', 'Northstar East Medical Center', 'NSEM', 'America/New_York', '240 Harbor Road', '+1-555-0200');

INSERT INTO departments (department_id, hospital_id, name, code, department_type, type, capacity) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Emergency Department', 'ED', 'EMERGENCY', 'EMERGENCY', 12),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Intensive Care Unit', 'ICU', 'ICU', 'ICU', 8),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Medical-Surgical Unit', 'MSU', 'WARD', 'WARD', 20),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Operating Room', 'OR', 'OPERATING_ROOM', 'OPERATING_ROOM', 0),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'Emergency Department', 'ED', 'EMERGENCY', 'EMERGENCY', 10),
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'Isolation Unit', 'ISO', 'ISOLATION', 'ISOLATION', 6);

INSERT INTO app_users (user_id, hospital_id, email, full_name, role, password_hash, hashed_password) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin@northstar.example', 'Jordan Lee', 'hospital_admin', crypt('demo123', gen_salt('bf')), crypt('demo123', gen_salt('bf'))),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'ops@northstar.example', 'Morgan Patel', 'operations_manager', crypt('demo123', gen_salt('bf')), crypt('demo123', gen_salt('bf'))),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'admin.east@northstar.example', 'Casey Rivera', 'hospital_admin', crypt('demo123', gen_salt('bf')), crypt('demo123', gen_salt('bf')));

INSERT INTO staff (staff_id, hospital_id, department_id, employee_code, full_name, staff_type, specialty, status, on_shift) VALUES
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'NS-D-001', 'Dr. Avery Chen', 'doctor', 'Emergency Medicine', 'active', TRUE),
('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'NS-D-002', 'Dr. Samira Brooks', 'doctor', 'Critical Care', 'active', TRUE),
('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'NS-N-001', 'Taylor Morgan', 'nurse', 'Emergency Nursing', 'active', TRUE),
('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'NS-N-002', 'Riley Shah', 'nurse', 'Critical Care Nursing', 'active', TRUE),
('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'NS-N-003', 'Jamie Wilson', 'nurse', 'Medical Nursing', 'active', TRUE),
('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'NE-N-001', 'Alex Kim', 'nurse', 'Emergency Nursing', 'active', TRUE);

INSERT INTO beds (bed_id, department_id, bed_number, bed_type, status, floor, is_monitoring_capable) VALUES
('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'ED-01', 'emergency', 'occupied', '1', TRUE),
('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'ED-02', 'emergency', 'occupied', '1', TRUE),
('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'ED-03', 'emergency', 'available', '1', TRUE),
('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'ICU-01', 'icu', 'occupied', '2', TRUE),
('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'ICU-02', 'icu', 'occupied', '2', TRUE),
('40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'ICU-03', 'icu', 'occupied', '2', TRUE),
('40000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'ICU-04', 'icu', 'available', '2', TRUE),
('40000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003', 'MSU-01', 'general', 'occupied', '3', FALSE),
('40000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000003', 'MSU-02', 'general', 'available', '3', FALSE),
('40000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000005', 'ED-01', 'emergency', 'available', '1', TRUE),
('40000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000006', 'ICU-01', 'icu', 'occupied', '2', TRUE),
('40000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000006', 'ICU-02', 'icu', 'available', '2', TRUE);

INSERT INTO patients (patient_id, hospital_id, medical_record_number, display_name, date_of_birth, sex_at_birth, postal_code) VALUES
('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'DEMO-0001', 'Demo Patient 001', '1978-04-12', 'F', '10001'),
('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'DEMO-0002', 'Demo Patient 002', '1959-09-28', 'M', '10002'),
('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'DEMO-0003', 'Demo Patient 003', '1992-01-15', 'F', '10003'),
('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'DEMO-0004', 'Demo Patient 004', '1966-11-05', 'M', '10004'),
('50000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'DEMO-0005', 'Demo Patient 005', '1987-06-21', 'F', '10005');

INSERT INTO admissions (admission_id, patient_id, department_id, bed_id, admission_type, status, triage_level, admitted_at, expected_discharge_at, chief_complaint) VALUES
('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'emergency', 'admitted', 'urgent', now() - INTERVAL '2 hours', now() + INTERVAL '1 day', 'Shortness of breath'),
('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000004', 'emergency', 'admitted', 'resuscitation', now() - INTERVAL '5 hours', now() + INTERVAL '3 days', 'Severe infection'),
('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000005', 'transfer', 'admitted', 'emergency', now() - INTERVAL '3 hours', now() + INTERVAL '2 days', 'Cardiac observation'),
('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000008', 'elective', 'admitted', 'semi_urgent', now() - INTERVAL '1 day', now() + INTERVAL '2 days', 'Post-operative care'),
('60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', NULL, 'emergency', 'registered', 'urgent', now() - INTERVAL '30 minutes', NULL, 'Fall with suspected fracture');

INSERT INTO bed_assignments (bed_id, admission_id, assigned_at) VALUES
('40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', now() - INTERVAL '2 hours'),
('40000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000002', now() - INTERVAL '5 hours'),
('40000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000003', now() - INTERVAL '3 hours'),
('40000000-0000-0000-0000-000000000008', '60000000-0000-0000-0000-000000000004', now() - INTERVAL '1 day');

INSERT INTO staff_shifts (staff_id, department_id, starts_at, ends_at, role_on_shift, patient_load, is_confirmed) VALUES
('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', date_trunc('hour', now()), date_trunc('hour', now()) + INTERVAL '12 hours', 'ED attending', 7, TRUE),
('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', date_trunc('hour', now()), date_trunc('hour', now()) + INTERVAL '12 hours', 'Triage nurse', 6, TRUE),
('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', date_trunc('hour', now()), date_trunc('hour', now()) + INTERVAL '12 hours', 'ICU attending', 4, TRUE),
('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', date_trunc('hour', now()), date_trunc('hour', now()) + INTERVAL '12 hours', 'ICU charge nurse', 3, TRUE),
('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', date_trunc('hour', now()), date_trunc('hour', now()) + INTERVAL '12 hours', 'Floor nurse', 2, TRUE),
('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000005', date_trunc('hour', now()), date_trunc('hour', now()) + INTERVAL '12 hours', 'ED nurse', 3, TRUE);

INSERT INTO equipment_types (equipment_type_id, name, category, requires_calibration) VALUES
('70000000-0000-0000-0000-000000000001', 'Ventilator', 'respiratory', TRUE),
('70000000-0000-0000-0000-000000000002', 'ECG Machine', 'diagnostics', TRUE),
('70000000-0000-0000-0000-000000000003', 'CT Scanner', 'imaging', TRUE),
('70000000-0000-0000-0000-000000000004', 'Patient Monitor', 'monitoring', FALSE);

INSERT INTO equipment (equipment_id, hospital_id, department_id, equipment_type_id, name, total_units, in_use_units, asset_tag, status, serial_number, last_service_at, next_service_at) VALUES
('71000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'Ventilator', 1, 1, 'NS-VENT-001', 'in_use', 'VENT-DEMO-001', now() - INTERVAL '20 days', now() + INTERVAL '70 days'),
('71000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000003', 'CT Scanner', 1, 0, 'NS-CT-001', 'available', 'CT-DEMO-001', now() - INTERVAL '10 days', now() + INTERVAL '80 days'),
('71000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000004', 'Patient Monitor', 1, 1, 'NS-MON-001', 'in_use', 'MON-DEMO-001', now() - INTERVAL '40 days', now() + INTERVAL '50 days'),
('71000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000002', 'ECG Machine', 1, 0, 'NE-ECG-001', 'maintenance', 'ECG-DEMO-001', now() - INTERVAL '120 days', now() - INTERVAL '5 days');

INSERT INTO supplies (hospital_id, department_id, name, sku, unit, quantity_on_hand, reorder_threshold) VALUES
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'N95 Respirator', 'PPE-N95', 'box', 18, 25),
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Trauma Dressing Kit', 'TRM-KIT', 'kit', 42, 20),
('00000000-0000-0000-0000-000000000001', NULL, 'Oxygen Cylinder', 'O2-CYL', 'cylinder', 14, 10),
('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'IV Start Kit', 'IV-KIT', 'kit', 11, 15);

INSERT INTO emergency_events (emergency_event_id, hospital_id, department_id, event_type, severity, started_at, patient_count, description) VALUES
('80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Emergency inflow surge', 'high', now() - INTERVAL '45 minutes', 9, 'Inbound arrivals are 37 percent above the rolling baseline.');

INSERT INTO predictions (prediction_id, hospital_id, department_id, prediction_type, forecast_for, predicted_value, lower_bound, upper_bound, confidence, model_version) VALUES
('90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'icu_occupancy', now() + INTERVAL '6 hours', 7.5, 6.8, 8.0, 0.91, 'icu-demand-v1.2'),
('90000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'emergency_inflow', now() + INTERVAL '2 hours', 14, 11, 18, 0.87, 'ed-inflow-v1.0'),
('90000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'bed_demand', now() + INTERVAL '6 hours', 18, 15, 21, 0.83, 'bed-demand-v1.1');

INSERT INTO alerts (alert_id, hospital_id, department_id, prediction_id, emergency_event_id, alert_type, severity, title, message) VALUES
('91000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000001', 'emergency_surge', 'high', 'Emergency surge detected', 'Emergency inflow is 37 percent above baseline. Activate surge beds and review nurse coverage.'),
('91000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000001', NULL, 'icu_capacity', 'watch', 'ICU capacity risk in six hours', 'Forecast indicates 94 percent ICU occupancy within six hours.');

INSERT INTO recommendations (hospital_id, department_id, alert_id, title, action, rationale, priority) VALUES
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', 'Open emergency surge capacity', 'Activate 4 additional emergency beds and assign 2 additional nurses.', 'Arrival volume is above baseline and the next two-hour forecast remains elevated.', 1),
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000002', 'Prepare ICU capacity', 'Review pending transfers and prepare one monitored bed.', 'The six-hour forecast approaches the operational ICU limit.', 2);

INSERT INTO resource_allocations (hospital_id, department_id, resource_type, quantity, starts_at, ends_at, status, reason) VALUES
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'nurse', 2, now(), now() + INTERVAL '8 hours', 'planned', 'Emergency surge response recommendation');

-- Provide enough hourly history for the forecasting service to train locally.
WITH profiles(department_type, total_beds, base_arrivals, staff_ratio, equipment_total) AS (
	VALUES
		('ICU'::department_type, 30, 1.2::numeric, .35::numeric, 40),
		('EMERGENCY'::department_type, 40, 4.0::numeric, .25::numeric, 25),
		('WARD'::department_type, 120, 2.5::numeric, .15::numeric, 60),
		('OPERATING_ROOM'::department_type, 10, .6::numeric, .40::numeric, 15),
		('ISOLATION'::department_type, 15, .3::numeric, .30::numeric, 10)
), hours AS (
	SELECT generate_series(
		date_trunc('hour', now() - INTERVAL '60 days'),
		date_trunc('hour', now()),
		INTERVAL '1 hour'
	) AS measured_at
)
INSERT INTO historical_metrics (
	department_type, timestamp, arrivals, admissions_count, occupied_beds,
	total_beds, staff_on_duty, equipment_in_use, equipment_total,
	day_of_week, hour_of_day, is_holiday
)
SELECT
	p.department_type,
	h.measured_at,
	GREATEST(0, ROUND(p.base_arrivals * (1 + .25 * SIN(EXTRACT(HOUR FROM h.measured_at) / 24 * 2 * PI())))::INTEGER),
	GREATEST(0, ROUND(p.base_arrivals * (1 + .25 * SIN(EXTRACT(HOUR FROM h.measured_at) / 24 * 2 * PI())))::INTEGER),
	GREATEST(0, LEAST(p.total_beds, ROUND(p.total_beds * (.60 + .12 * SIN(EXTRACT(HOUR FROM h.measured_at) / 24 * 2 * PI())))::INTEGER)),
	p.total_beds,
	GREATEST(2, ROUND(p.total_beds * p.staff_ratio)::INTEGER),
	ROUND(p.equipment_total * .65)::INTEGER,
	p.equipment_total,
	EXTRACT(ISODOW FROM h.measured_at)::INTEGER - 1,
	EXTRACT(HOUR FROM h.measured_at)::INTEGER,
	FALSE
FROM profiles p
CROSS JOIN hours h;

COMMIT;

BEGIN;

CREATE OR REPLACE VIEW department_operational_status AS
WITH bed_totals AS (
    SELECT department_id,
        COUNT(*) FILTER (WHERE status NOT IN ('maintenance', 'blocked')) AS staffed_beds,
        COUNT(*) FILTER (WHERE status = 'occupied') AS occupied_beds,
        COUNT(*) FILTER (WHERE status = 'available') AS available_beds
    FROM beds
    GROUP BY department_id
), admission_totals AS (
    SELECT department_id, COUNT(*) AS active_admissions
    FROM admissions
    WHERE status IN ('registered', 'admitted')
    GROUP BY department_id
), staff_totals AS (
    SELECT department_id, COUNT(*) AS active_staff
    FROM staff
    WHERE status = 'active'
    GROUP BY department_id
)
SELECT
    d.department_id,
    d.hospital_id,
    d.name AS department_name,
    d.department_type,
    COALESCE(bt.staffed_beds, 0) AS staffed_beds,
    COALESCE(bt.occupied_beds, 0) AS occupied_beds,
    COALESCE(bt.available_beds, 0) AS available_beds,
    ROUND(100.0 * COALESCE(bt.occupied_beds, 0) / NULLIF(bt.staffed_beds, 0), 1) AS occupancy_percent,
    COALESCE(at.active_admissions, 0) AS active_admissions,
    COALESCE(st.active_staff, 0) AS active_staff,
    CASE
        WHEN COALESCE(bt.occupied_beds, 0) >= COALESCE(bt.staffed_beds, 0) AND COALESCE(bt.staffed_beds, 0) > 0 THEN 'critical'::risk_level
        WHEN COALESCE(bt.staffed_beds, 0) > 0 AND COALESCE(bt.occupied_beds, 0) >= COALESCE(bt.staffed_beds, 0) * 0.9 THEN 'high'::risk_level
        WHEN COALESCE(bt.staffed_beds, 0) > 0 AND COALESCE(bt.occupied_beds, 0) >= COALESCE(bt.staffed_beds, 0) * 0.75 THEN 'watch'::risk_level
        ELSE 'normal'::risk_level
    END AS risk_level
FROM departments d
LEFT JOIN bed_totals bt ON bt.department_id = d.department_id
LEFT JOIN admission_totals at ON at.department_id = d.department_id
LEFT JOIN staff_totals st ON st.department_id = d.department_id
WHERE d.is_active
;

CREATE OR REPLACE VIEW command_center_overview AS
SELECT
    h.hospital_id,
    h.name AS hospital_name,
    COUNT(DISTINCT b.bed_id) FILTER (WHERE b.status <> 'maintenance' AND b.status <> 'blocked') AS operational_beds,
    COUNT(DISTINCT b.bed_id) FILTER (WHERE b.status = 'occupied') AS occupied_beds,
    ROUND(100.0 * COUNT(DISTINCT b.bed_id) FILTER (WHERE b.status = 'occupied') / NULLIF(COUNT(DISTINCT b.bed_id) FILTER (WHERE b.status <> 'maintenance' AND b.status <> 'blocked'), 0), 1) AS occupancy_percent,
    COUNT(DISTINCT b.bed_id) FILTER (WHERE b.status = 'available') AS available_beds,
    COUNT(DISTINCT b.bed_id) FILTER (WHERE b.bed_type = 'icu' AND b.status = 'occupied') AS occupied_icu_beds,
    COUNT(DISTINCT b.bed_id) FILTER (WHERE b.bed_type = 'icu' AND b.status <> 'maintenance' AND b.status <> 'blocked') AS operational_icu_beds,
    COUNT(DISTINCT s.staff_id) FILTER (WHERE s.status = 'active') AS active_staff,
    COUNT(DISTINCT e.emergency_event_id) FILTER (WHERE e.ended_at IS NULL) AS active_emergency_events,
    COUNT(DISTINCT al.alert_id) FILTER (WHERE al.status IN ('open', 'acknowledged')) AS active_alerts,
    CASE
        WHEN COUNT(DISTINCT al.alert_id) FILTER (WHERE al.status IN ('open', 'acknowledged') AND al.severity = 'critical') > 0 THEN 'critical'::risk_level
        WHEN COUNT(DISTINCT al.alert_id) FILTER (WHERE al.status IN ('open', 'acknowledged') AND al.severity = 'high') > 0 THEN 'high'::risk_level
        WHEN COUNT(DISTINCT al.alert_id) FILTER (WHERE al.status IN ('open', 'acknowledged') AND al.severity = 'watch') > 0 THEN 'watch'::risk_level
        ELSE 'normal'::risk_level
    END AS overall_risk_level
FROM hospitals h
LEFT JOIN departments d ON d.hospital_id = h.hospital_id AND d.is_active
LEFT JOIN beds b ON b.department_id = d.department_id
LEFT JOIN staff s ON s.hospital_id = h.hospital_id
LEFT JOIN emergency_events e ON e.hospital_id = h.hospital_id
LEFT JOIN alerts al ON al.hospital_id = h.hospital_id
WHERE h.is_active
GROUP BY h.hospital_id, h.name;

CREATE OR REPLACE VIEW active_alerts AS
SELECT
    al.alert_id,
    al.hospital_id,
    h.name AS hospital_name,
    d.name AS department_name,
    al.alert_type,
    al.severity,
    al.status,
    al.title,
    al.message,
    al.started_at,
    EXTRACT(EPOCH FROM (now() - al.started_at)) / 3600.0 AS age_hours
FROM alerts al
JOIN hospitals h ON h.hospital_id = al.hospital_id
LEFT JOIN departments d ON d.department_id = al.department_id
WHERE al.status IN ('open', 'acknowledged');

CREATE OR REPLACE VIEW upcoming_demand_forecast AS
SELECT
    p.prediction_id,
    p.hospital_id,
    h.name AS hospital_name,
    d.name AS department_name,
    p.prediction_type,
    p.forecast_for,
    p.predicted_value,
    p.lower_bound,
    p.upper_bound,
    p.confidence,
    p.model_version
FROM predictions p
JOIN hospitals h ON h.hospital_id = p.hospital_id
LEFT JOIN departments d ON d.department_id = p.department_id
WHERE p.forecast_for >= now()
ORDER BY p.forecast_for;

CREATE OR REPLACE FUNCTION record_audit_log(
    p_hospital_id UUID,
    p_actor_user_id UUID,
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_action VARCHAR,
    p_changes JSONB DEFAULT '{}'::jsonb,
    p_request_id VARCHAR DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
    new_audit_id UUID;
BEGIN
    INSERT INTO audit_logs (hospital_id, actor_user_id, entity_type, entity_id, action, changes, request_id)
    VALUES (p_hospital_id, p_actor_user_id, p_entity_type, p_entity_id, p_action, p_changes, p_request_id)
    RETURNING audit_id INTO new_audit_id;
    RETURN new_audit_id;
END;
$$;

COMMIT;

export type UserRole = 'system_admin' | 'hospital_admin' | 'doctor' | 'nurse' | 'operations_manager';
export type BedStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'blocked' | 'discharge_pending';

export interface AppUser { id: string; email: string; full_name: string; role: UserRole | string; }
export interface Patient { id: string; medical_record_number: string; display_name: string; date_of_birth: string; }
export interface Bed { id: string; department_id: string; bed_number: string; bed_type: string; status: BedStatus; }
export interface BedSummary { department_type: string; total_beds: number; occupied: number; available: number; cleaning: number; discharge_pending: number; occupancy_pct: number; }
export interface Staff { id: string; hospital_id: string; department_id: string | null; employee_code: string; full_name: string; staff_type: string; specialty: string | null; status: string; on_shift: boolean; }
export interface Alert { id: string; hospital_id: string; department_id: string | null; alert_type: string; severity: string; status: string; title: string; message: string; created_at: string; }
export interface BedOrder { id: string; user_id: string; bed_id: string; department_id: string; order_date: string; status: 'pending' | 'approved' | 'fulfilled' | 'rejected' | string; notes: string | null; bed_type?: string; quantity?: number; }
export interface Review { id: string; user_id: string; bed_order_id: string | null; rating: number; comment: string; review_date: string; }
export interface CommandCenterState { departments: Array<Record<string, unknown>>; lastUpdated: string | null; loading: boolean; error: string | null; }

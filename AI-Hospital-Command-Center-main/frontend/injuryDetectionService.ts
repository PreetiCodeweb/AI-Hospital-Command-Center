import { apiRequest } from './apiClient';

export type InjurySeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type InjuryFinding = { region: string; possible_injury: string; confidence: number; severity: InjurySeverity; recommended_action: string };
export type InjuryScanResponse = { scan_id: string; patient_ref?: string | null; scanned_at: string; scan_status: string; areas_of_concern: number; findings: InjuryFinding[]; disclaimer?: string };

export function simulateInjuryScan(payload: { patient_ref?: string | null; simulate_region_hint?: string | null }) {
  return apiRequest<InjuryScanResponse>('/api/v1/injury-scan/simulate', { method: 'POST', body: JSON.stringify(payload) });
}

export function uploadInjuryScan(payload: FormData) {
  return apiRequest<InjuryScanResponse>('/api/v1/injury-scan/upload', { method: 'POST', body: payload });
}

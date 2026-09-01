import { apiRequest } from './apiClient';

export type InjurySeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface InjuryFinding {
  region: string;
  possible_injury: string;
  confidence: number;
  severity: InjurySeverity;
  recommended_action: string;
}

export interface InjuryScanResponse {
  scan_id: string;
  scanned_at: string;
  areas_of_concern: number;
  findings: InjuryFinding[];
}

export function submitInjuryAnalysis(payload: FormData) {
  return apiRequest('/api/v1/injury-analysis', { method: 'POST', body: payload });
}

export async function uploadInjuryScan(form: FormData): Promise<InjuryScanResponse> {
  return apiRequest('/api/v1/injury-analysis/upload', { method: 'POST', body: form });
}

export async function simulateInjuryScan(params: {
  patient_ref?: string | null;
  simulate_region_hint: string;
}): Promise<InjuryScanResponse> {
  return apiRequest('/api/v1/injury-analysis/simulate', {
    method: 'POST',
    body: JSON.stringify(params),
    headers: { 'Content-Type': 'application/json' },
  });
}

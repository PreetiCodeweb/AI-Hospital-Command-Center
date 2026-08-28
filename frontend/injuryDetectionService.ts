import { apiRequest } from './apiClient';

export function submitInjuryAnalysis(payload: FormData) {
  return apiRequest('/api/v1/injury-analysis', { method: 'POST', body: payload });
}

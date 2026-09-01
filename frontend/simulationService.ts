import { apiRequest } from './apiClient';

export function runSimulation(payload: Record<string, unknown>) {
  return apiRequest('/api/simulations', { method: 'POST', body: JSON.stringify(payload) });
}

import { apiRequest } from './apiClient';

export function getDashboard() {
  return apiRequest<{ departments: unknown[] }>('/api/dashboard');
}

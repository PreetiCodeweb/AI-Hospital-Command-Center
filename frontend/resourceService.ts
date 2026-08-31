import { apiRequest } from './apiClient';

export function getResources() {
  return apiRequest('/api/v1/resources');
}

import { apiRequest } from './apiClient';

export function getDigitalTwin() {
  return apiRequest('/api/v1/digital-twin');
}

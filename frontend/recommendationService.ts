import { apiRequest } from './apiClient';

export function getRecommendations() {
  return apiRequest('/api/v1/recommendations');
}

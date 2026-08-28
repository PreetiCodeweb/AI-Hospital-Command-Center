import { apiRequest } from './apiClient';

export function getForecast(departmentType = 'ICU', horizonHours = 12, metric = 'occupancy_pct') {
  return apiRequest(`/api/forecast/${departmentType}?horizon_hours=${horizonHours}`);
}

export function requestForecast(departmentType: string, horizonHours = 12, metric = 'occupancy_pct') {
  return apiRequest('/api/forecast', {
    method: 'POST',
    body: JSON.stringify({ department_type: departmentType, metric, horizon_hours: horizonHours }),
  });
}

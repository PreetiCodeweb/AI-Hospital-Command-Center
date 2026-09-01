import { apiRequest } from './apiClient';

type TokenResponse = { access_token: string; token_type: string };
export type AppUser = { id: string; email: string; full_name: string; role: string };
export type RegistrationInput = Pick<AppUser, 'email' | 'full_name'> & { password: string };

export async function login(email: string, password: string): Promise<TokenResponse> {
  const body = new URLSearchParams({ username: email, password });
  const token = await apiRequest<TokenResponse>('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  window.localStorage.setItem('access_token', token.access_token);
  return token;
}

export async function register(input: RegistrationInput): Promise<AppUser> {
  return apiRequest<AppUser>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(input) });
}

export function logout() {
  window.localStorage.removeItem('access_token');
}

export function getCurrentUser() {
  return apiRequest('/api/v1/auth/me');
}

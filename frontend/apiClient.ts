const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function getErrorMessage(body: string, status: number): string {
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed === 'object' && parsed !== null && 'detail' in parsed && typeof parsed.detail === 'string') return parsed.detail;
    if (typeof parsed === 'object' && parsed !== null && 'message' in parsed && typeof parsed.message === 'string') return parsed.message;
  } catch { /* Non-JSON server responses are handled by the status fallback. */ }
  return body || `Request failed with status ${status}`;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('access_token');
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, credentials: 'include', signal: init.signal ?? controller.signal });
    if (!response.ok) throw new ApiError(response.status, getErrorMessage(await response.text(), response.status));
    if (response.status === 204) return undefined as T;
    return await response.json() as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('The request timed out. Check that the API is running.');
    throw error;
  } finally { clearTimeout(timeout); }
}

export async function submitInjuryAnalysis(payload: FormData) {
  return fetch('/api/injury-analysis', { method: 'POST', body: payload }).then((response) => response.json());
}

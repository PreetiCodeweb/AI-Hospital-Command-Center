export async function runSimulation(payload: Record<string, unknown>) {
  return fetch('/api/simulations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then((response) => response.json());
}

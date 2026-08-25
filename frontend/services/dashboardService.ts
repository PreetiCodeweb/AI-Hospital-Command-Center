export async function getDashboard() {
  return fetch('/api/dashboard').then((response) => response.json());
}

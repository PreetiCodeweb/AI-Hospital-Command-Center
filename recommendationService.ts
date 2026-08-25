export async function getRecommendations() {
  return fetch('/api/recommendations').then((response) => response.json());
}

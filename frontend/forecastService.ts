export async function getForecast() {
  return fetch('/api/forecast').then((response) => response.json());
}

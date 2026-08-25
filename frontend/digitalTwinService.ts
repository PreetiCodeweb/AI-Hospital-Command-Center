export async function getDigitalTwin() {
  return fetch('/api/digital-twin').then((response) => response.json());
}

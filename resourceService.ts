export async function getResources() {
  return fetch('/api/resources').then((response) => response.json());
}

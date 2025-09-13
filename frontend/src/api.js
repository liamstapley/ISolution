export async function apiGet(path) {
  const res = await fetch(path); // CRA proxy forwards /api/* -> backend
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
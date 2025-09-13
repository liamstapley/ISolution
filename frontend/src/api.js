const withAuth = (opts = {}) => {
  const token = localStorage.getItem("token");
  return {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
};

export const apiGet = (path) => fetch(path, withAuth()).then(r => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
});

export const apiPost = (path, body) => fetch(path, withAuth({
  method: "POST",
  body: JSON.stringify(body),
})).then(r => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
});

export const authHeaders = () => {
  const t = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
};

export async function apiAuthPost(path, body) {
  const r = await fetch(path, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body ?? {}),
  });
  let data = null;
  try { data = await r.json(); } catch {}
  if (!r.ok) throw new Error((data && (data.detail || data.message)) || `HTTP ${r.status}`);
  return data ?? {};
}
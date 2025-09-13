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
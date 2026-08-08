async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.detail ?? `HTTP ${response.status}`);
  }
  return body;
}

export const api = {
  status: () => request("/status"),
  models: () => request("/models"),
  load: (model) =>
    request("/models/load", { method: "POST", body: JSON.stringify({ model }) }),
  unload: (model) =>
    request("/models/unload", { method: "POST", body: JSON.stringify({ model }) }),
  customModels: () => request("/custom"),
  saveCustom: (name, payload) =>
    request(`/custom/${name}`, { method: "PUT", body: JSON.stringify(payload) }),
  rebuild: (name) => request(`/custom/${name}/rebuild`, { method: "POST" }),
};

export function formatBytes(bytes) {
  if (!bytes) return "0 GB";
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

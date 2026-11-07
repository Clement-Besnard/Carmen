/**
 * Client de l'API du dashboard (FastAPI). Les routes sont inchangees.
 *
 * Les erreurs portent un `kind` pour que l'UI puisse dire *quoi* ne repond pas :
 *  - "backend" : le dashboard lui-meme est injoignable (fetch a echoue)
 *  - "ollama"  : le backend repond mais Ollama non (HTTP 503)
 *  - "http"    : toute autre erreur renvoyee par l'API
 */
export class ApiError extends Error {
  constructor(message, { kind, status } = {}) {
    super(message);
    this.kind = kind;
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError("Le serveur du dashboard ne répond pas.", { kind: "backend" });
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    // Une 5xx sans corps JSON ne vient pas de FastAPI mais d'un proxy devant
    // (vite en dev, reverse proxy en prod) : c'est le backend qui manque.
    const kind =
      response.status === 503 && body
        ? "ollama"
        : response.status >= 500 && !body
          ? "backend"
          : "http";
    const message =
      kind === "backend" ? "Le serveur du dashboard ne répond pas." : body?.detail;
    throw new ApiError(message ?? `HTTP ${response.status}`, {
      kind,
      status: response.status,
    });
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
  customModel: (name) => request(`/custom/${encodeURIComponent(name)}`),
  saveCustom: (name, payload) =>
    request(`/custom/${encodeURIComponent(name)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  rebuild: (name) =>
    request(`/custom/${encodeURIComponent(name)}/rebuild`, { method: "POST" }),
  services: () => request("/services"),
  config: () => request("/config"),
};

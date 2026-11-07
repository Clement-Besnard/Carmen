const GIB = 1024 ** 3;

const decimal = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const clock = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** 17703821638 -> "16,5" (Go, sans unite). */
export function gigabytes(bytes) {
  return decimal.format((bytes || 0) / GIB);
}

/** Total VRAM affiche sans decimale inutile : 24 Go et non 24,0 Go. */
export function gigabytesRound(bytes) {
  const value = (bytes || 0) / GIB;
  return Number.isInteger(Math.round(value * 10) / 10)
    ? integer.format(value)
    : decimal.format(value);
}

export function percent(part, total) {
  if (!total) return 0;
  return Math.min(100, Math.max(0, (part / total) * 100));
}

export function clockTime(date) {
  return date ? clock.format(date) : "";
}

/** "clem-assist:latest" -> { base: "clem-assist", tag: "latest" } */
export function splitModelName(name) {
  const index = name.lastIndexOf(":");
  if (index === -1) return { base: name, tag: null };
  return { base: name.slice(0, index), tag: name.slice(index + 1) };
}

/**
 * Ollama renvoie un expires_at lointain (an 2300+) pour keep_alive: -1.
 * On le traduit en "resident" plutot qu'en date absurde.
 */
export function residency(expiresAt, now = Date.now()) {
  if (!expiresAt) return null;
  const remaining = new Date(expiresAt).getTime() - now;
  if (remaining > 365 * 24 * 3600 * 1000) return "résident";
  if (remaining <= 0) return "en cours de libération";
  const minutes = Math.round(remaining / 60000);
  return minutes < 1 ? "libéré dans moins d'une minute" : `libéré dans ${minutes} min`;
}

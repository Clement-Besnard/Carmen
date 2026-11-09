const GIB = 1024 ** 3;

// Formats et unites suivent la langue de l'interface (cf. i18n.jsx).
const LOCALES = { fr: "fr-FR", en: "en-GB" };
const UNITS = {
  fr: ["Ko", "Mo", "Go", "To"],
  en: ["KB", "MB", "GB", "TB"],
};

let lang = "fr";
let decimal;
let integer;
let clock;

export function setFormatLocale(next) {
  lang = UNITS[next] ? next : "fr";
  const locale = LOCALES[lang];
  decimal = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  integer = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  clock = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

setFormatLocale("fr");

/** Unite du gigaoctet dans la langue courante : "Go" ou "GB". */
export function gbUnit() {
  return UNITS[lang][2];
}

/** 17703821638 -> "16,5" / "16.5" (sans unite). */
export function gigabytes(bytes) {
  return decimal.format((bytes || 0) / GIB);
}

/** Total VRAM affiche sans decimale inutile : 24 et non 24,0. */
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

/** Taille lisible a toute echelle : 1305 -> "1,3 Ko", 17741872154 -> "16,5 Go". */
export function humanBytes(bytes) {
  const units = UNITS[lang];
  const value = bytes || 0;
  if (value < 1024) return value === 0 ? `0 ${units[0]}` : `< 1 ${units[0]}`;
  let size = value / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${decimal.format(size)} ${units[unit]}`;
}

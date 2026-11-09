/**
 * Traduction FR / EN, sans dependance.
 *
 * La langue est memorisee dans le navigateur ; a la premiere visite, elle suit
 * celle du navigateur (francais si elle commence par "fr", anglais sinon).
 * t(cle, ...args) renvoie une chaine, ou du JSX quand le texte contient du code.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setFormatLocale } from "./format.js";
import { MESSAGES } from "./messages.jsx";

export const LANGUAGES = ["fr", "en"];
const STORAGE_KEY = "carmen.lang";

function initialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGUAGES.includes(saved)) return saved;
  } catch {
    // Stockage indisponible (navigation privee...) : on suit le navigateur.
  }
  return (navigator.language || "").toLowerCase().startsWith("fr") ? "fr" : "en";
}

let current = initialLanguage();
setFormatLocale(current);

/** Traduit avec la langue courante. Utilisable hors composant. */
export function translate(key, ...args) {
  const value = MESSAGES[current][key] ?? MESSAGES.fr[key];
  if (value === undefined) {
    console.warn(`[i18n] cle manquante : ${key}`);
    return key;
  }
  return typeof value === "function" ? value(...args) : value;
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(current);

  const setLang = useCallback((next) => {
    if (!LANGUAGES.includes(next)) return;
    current = next;
    setFormatLocale(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Le choix ne sera simplement pas memorise.
    }
    setLangState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Nouvelle valeur a chaque changement de langue : tous les consommateurs
  // se re-rendent avec les nouveaux textes.
  const value = useMemo(() => ({ lang, setLang, t: translate }), [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

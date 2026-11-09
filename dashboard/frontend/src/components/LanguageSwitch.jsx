import { LANGUAGES, useI18n } from "../lib/i18n.jsx";
import "./LanguageSwitch.css";

// Nom de chaque langue dans sa propre langue, comme le veut l'usage.
const NAMES = { fr: "Français", en: "English" };

/**
 * Choix de la langue.
 * `sidebar` : pied de menu, intitule + deux options pleine largeur.
 * `compact` : barre du haut sur mobile, codes FR / EN.
 */
export default function LanguageSwitch({ variant = "sidebar" }) {
  const { lang, setLang, t } = useI18n();
  const compact = variant === "compact";
  return (
    <div className={`lang-switch lang-switch--${variant}`}>
      {!compact && (
        <p className="lang-title" id="lang-title">
          {t("lang.title")}
        </p>
      )}
      <div
        className="lang-options"
        role="group"
        aria-label={compact ? t("lang.label") : undefined}
        aria-labelledby={compact ? undefined : "lang-title"}
      >
        {LANGUAGES.map((code) => (
          <button
            key={code}
            type="button"
            className="lang-option"
            lang={code}
            aria-pressed={lang === code}
            onClick={() => setLang(code)}
          >
            {compact ? code.toUpperCase() : NAMES[code]}
          </button>
        ))}
      </div>
    </div>
  );
}

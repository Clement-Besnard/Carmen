import { LANGUAGES, useI18n } from "../lib/i18n.jsx";
import "./LanguageSwitch.css";

/**
 * Choix de la langue : pilule FR | EN dont le curseur blanc coulisse vers
 * la langue active.
 * `sidebar` : pied de menu, avec l'intitule "Langue" a gauche.
 * `compact` : barre du haut sur mobile, pilule seule.
 */
export default function LanguageSwitch({ variant = "sidebar" }) {
  const { lang, setLang, t } = useI18n();
  const compact = variant === "compact";
  const index = LANGUAGES.indexOf(lang);

  return (
    <div className={`lang-switch lang-switch--${variant}`}>
      {!compact && (
        <span className="lang-title" id="lang-title">
          {t("lang.title")}
        </span>
      )}
      <div
        className="lang-pill"
        role="group"
        aria-label={compact ? t("lang.label") : undefined}
        aria-labelledby={compact ? undefined : "lang-title"}
        style={{ "--lang-index": index, "--lang-count": LANGUAGES.length }}
      >
        <span className="lang-thumb" aria-hidden="true" />
        {LANGUAGES.map((code) => (
          <button
            key={code}
            type="button"
            className="lang-option"
            lang={code}
            aria-pressed={lang === code}
            onClick={() => setLang(code)}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { Link, isActive, useRouter } from "../lib/router.jsx";
import { useI18n } from "../lib/i18n.jsx";
import { useStack } from "../lib/stack.jsx";
import LanguageSwitch from "./LanguageSwitch.jsx";
import Logo from "./Logo.jsx";
import StatusBanner from "./StatusBanner.jsx";
import "./Shell.css";

// `needsServices` : entree affichee seulement si des services sont declares.
// `key` : cle de traduction (libelle complet, et `.short` pour les onglets mobiles).
export const NAV_ITEMS = [
  { to: "/", key: "nav.overview" },
  { to: "/modeles", key: "nav.models" },
  { to: "/custom", key: "nav.custom" },
  { to: "/services", key: "nav.services", needsServices: true },
  { to: "/parametres", key: "nav.settings" },
];

function NavList({ variant }) {
  const { path } = useRouter();
  const { hasServices } = useStack();
  const { t } = useI18n();
  const items = NAV_ITEMS.filter((item) => !item.needsServices || hasServices);
  return (
    <ul className={`nav nav--${variant}`}>
      {items.map((item) => (
        <li key={item.to}>
          <Link
            to={item.to}
            className="nav-link"
            aria-current={isActive(path, item.to) ? "page" : undefined}
          >
            {t(variant === "sidebar" ? item.key : `${item.key}.short`)}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Shell({ children }) {
  const { path } = useRouter();
  const { t } = useI18n();
  const firstRender = useRef(true);

  // Apres navigation, le focus va au titre de la nouvelle page : le lecteur
  // d'ecran l'annonce et Tab repart du contenu.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.querySelector("main h1")?.focus({ preventScroll: true });
  }, [path]);

  return (
    <div className="shell">
      <a className="skip-link" href="#content">
        {t("skip")}
      </a>

      <aside className="sidebar">
        <Link to="/" className="brand">
          <Logo />
          Carmen
        </Link>
        <nav aria-label={t("nav.label")}>
          <NavList variant="sidebar" />
        </nav>
        <LanguageSwitch />
      </aside>

      <header className="topbar">
        <Link to="/" className="brand">
          <Logo />
          Carmen
        </Link>
        <LanguageSwitch variant="compact" />
      </header>

      <main id="content" className="content">
        <div className="content-inner">
          <StatusBanner />
          {children}
        </div>
      </main>

      <nav className="tabbar" aria-label={t("nav.label")}>
        <NavList variant="tabs" />
      </nav>
    </div>
  );
}

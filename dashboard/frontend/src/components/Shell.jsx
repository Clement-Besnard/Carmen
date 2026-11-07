import { useEffect, useRef } from "react";
import { Link, isActive, useRouter } from "../lib/router.jsx";
import { useStack } from "../lib/stack.jsx";
import StatusBanner from "./StatusBanner.jsx";
import "./Shell.css";

// `needsServices` : entree affichee seulement si des services sont declares.
export const NAV_ITEMS = [
  { to: "/", label: "Vue d'ensemble", short: "Accueil" },
  { to: "/modeles", label: "Modèles", short: "Modèles" },
  { to: "/custom", label: "Modèles custom", short: "Custom" },
  { to: "/services", label: "Services", short: "Services", needsServices: true },
  { to: "/parametres", label: "Paramètres", short: "Réglages" },
];

function NavList({ variant }) {
  const { path } = useRouter();
  const { hasServices } = useStack();
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
            {variant === "sidebar" ? item.label : item.short}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Shell({ children }) {
  const { path } = useRouter();
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
        Aller au contenu
      </a>

      <aside className="sidebar">
        <Link to="/" className="brand">
          Carmen
        </Link>
        <nav aria-label="Navigation principale">
          <NavList variant="sidebar" />
        </nav>
      </aside>

      <header className="topbar">
        <Link to="/" className="brand">
          Carmen
        </Link>
      </header>

      <main id="content" className="content">
        <StatusBanner />
        {children}
      </main>

      <nav className="tabbar" aria-label="Navigation principale">
        <NavList variant="tabs" />
      </nav>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { Link, isActive, useRouter } from "../lib/router.jsx";
import { useStack } from "../lib/stack.jsx";
import StatusBanner from "./StatusBanner.jsx";
import StatusDot from "./StatusDot.jsx";
import "./Shell.css";

export const NAV_ITEMS = [
  { to: "/", label: "Vue d'ensemble", short: "Accueil" },
  { to: "/modeles", label: "Modèles", short: "Modèles" },
  { to: "/custom", label: "Modèles custom", short: "Custom" },
  { to: "/services", label: "Services", short: "Services" },
  { to: "/parametres", label: "Paramètres", short: "Réglages" },
];

/** Etat de la connexion a Ollama, en bas de la barre laterale / en haut sur mobile. */
function Connection({ compact = false }) {
  const { phase, error, status } = useStack();
  const down = Boolean(error) && (error.kind !== "http" || phase === "unavailable");
  const state = phase === "loading" ? "pending" : down ? "down" : "up";
  const label = {
    pending: "Connexion…",
    down: error?.kind === "backend" ? "Dashboard injoignable" : "Ollama injoignable",
    up: status?.version ? `Ollama ${status.version}` : "Ollama connecté",
  }[state];

  return (
    <div className="connection" data-state={state} aria-live="polite">
      <p className="connection-state">
        <StatusDot state={state} />
        <span>{compact && state === "up" ? status?.version ?? "" : label}</span>
        {compact && state === "up" && <span className="visually-hidden">{label}</span>}
      </p>
      {!compact && status?.ollama_url && (
        <p className="connection-url mono">{status.ollama_url.replace(/^https?:\/\//, "")}</p>
      )}
    </div>
  );
}

function NavList({ variant }) {
  const { path } = useRouter();
  return (
    <ul className={`nav nav--${variant}`}>
      {NAV_ITEMS.map((item) => (
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
          Nimbus
        </Link>
        <nav aria-label="Navigation principale">
          <NavList variant="sidebar" />
        </nav>
        <Connection />
      </aside>

      <header className="topbar">
        <Link to="/" className="brand">
          Nimbus
        </Link>
        <Connection compact />
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

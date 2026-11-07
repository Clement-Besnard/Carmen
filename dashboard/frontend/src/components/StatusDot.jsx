import "./StatusDot.css";

/**
 * Rond plein = repond, rond vide = ne repond pas, demi = en attente.
 * Purement visuel : le texte a cote porte toujours l'information.
 */
export default function StatusDot({ state }) {
  return <span className="status-dot" data-state={state} aria-hidden="true" />;
}

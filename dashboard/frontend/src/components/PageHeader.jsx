import { useEffect } from "react";
import "./PageHeader.css";

/**
 * Titre de page compact : titre + ligne de contexte a gauche, actions a droite.
 * `crumb` : petit libelle au-dessus du titre (ex. "Modèles custom /").
 */
export default function PageHeader({ title, meta, actions, crumb, mono = false }) {
  useEffect(() => {
    document.title = `${title} — Nimbus`;
  }, [title]);

  return (
    <header className="page-header">
      <div className="page-header-text">
        {crumb && <p className="page-crumb">{crumb}</p>}
        {/* tabIndex -1 : cible du focus apres navigation (cf. Shell). */}
        <h1 className={`page-title${mono ? " mono" : ""}`} tabIndex={-1}>
          {title}
        </h1>
        {meta && <p className="page-meta">{meta}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

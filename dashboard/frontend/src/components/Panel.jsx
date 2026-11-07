import "./Panel.css";

/**
 * Panneau blanc a filet fin. En-tete optionnel : titre, meta, actions.
 * Avec un titre, rendu en <section> nommee par ce titre (passer `titleId`).
 */
export default function Panel({ title, meta, actions, children, className = "", titleId }) {
  const Tag = title ? "section" : "div";
  return (
    <Tag className={`panel ${className}`} aria-labelledby={title ? titleId : undefined}>
      {(title || actions) && (
        <header className="panel-head">
          {title && (
            <h2 className="panel-title" id={titleId}>
              {title}
            </h2>
          )}
          {meta && <span className="panel-meta">{meta}</span>}
          {actions && <span className="panel-actions">{actions}</span>}
        </header>
      )}
      {children}
    </Tag>
  );
}

/** Corps de panneau avec marges internes (sinon le contenu va bord a bord). */
export function PanelBody({ children, className = "" }) {
  return <div className={`panel-body ${className}`}>{children}</div>;
}

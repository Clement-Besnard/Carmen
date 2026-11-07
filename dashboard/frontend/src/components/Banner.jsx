import "./Banner.css";

/** Bandeau d'erreur : ce qui s'est passe, puis quoi faire. */
export default function Banner({ title, action, children }) {
  return (
    <div className="banner" role="alert">
      <div className="banner-body">
        <p className="banner-title">{title}</p>
        {children}
      </div>
      {action && <div className="banner-action">{action}</div>}
    </div>
  );
}

/** Note neutre en retrait (filet noir a gauche), pour une regle a connaitre. */
export function Notice({ children }) {
  return <p className="notice">{children}</p>;
}

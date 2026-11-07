import "./Button.css";

/**
 * primary   : noir, texte blanc — une seule action principale par ecran.
 * secondary : contour, pour les actions d'appoint (defaut).
 * ghost     : sans contour, pour les actions repetees dans une liste.
 * `href` -> rendu en <a> (lien externe : ouvre un nouvel onglet).
 */
export default function Button({
  variant = "secondary",
  size = "regular",
  type = "button",
  className = "",
  href,
  children,
  ...props
}) {
  const classes = `button button--${variant} button--${size} ${className}`;
  if (href) {
    return (
      <a className={classes} href={href} target="_blank" rel="noreferrer" {...props}>
        {children}
        <span aria-hidden="true">↗</span>
        <span className="visually-hidden"> (nouvel onglet)</span>
      </a>
    );
  }
  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}

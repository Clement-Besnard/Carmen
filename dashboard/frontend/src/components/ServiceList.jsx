import StatusDot from "./StatusDot.jsx";
import "./ServiceList.css";

/**
 * URL publique d'un service : celle fournie par le backend (SERVICES_PUBLIC_HOST)
 * ou, a defaut, le meme hote que le dashboard (loopback ou VPN).
 */
export function serviceHref(service) {
  return service.href ?? `${window.location.protocol}//${window.location.hostname}:${service.port}`;
}

function stateText(service) {
  return service.up ? `${service.latency_ms} ms` : "injoignable";
}

/**
 * Liste des services de la stack.
 * `compact` : nom, port et etat (accueil). Sinon description, lien et diagnostic.
 */
export default function ServiceList({ services, compact = false }) {
  return (
    <ul className={`service-list${compact ? " service-list--compact" : ""}`}>
      {services.map((service) => (
        <li key={service.id} className="service-row" data-down={!service.up || undefined}>
          <span className="service-main">
            <span className="service-name">{service.name}</span>
            {!compact && (
              <span className={service.up ? "soft" : "service-diagnostic"}>
                {service.up ? (
                  service.description
                ) : (
                  <>
                    Pas de réponse. Vérifier avec{" "}
                    <code>docker compose logs {service.id}</code>
                  </>
                )}
              </span>
            )}
          </span>
          <span className="service-port mono soft">:{service.port}</span>
          <span className="service-state mono" data-up={service.up}>
            <StatusDot state={service.up ? "up" : "down"} />
            {compact ? (
              <span className="visually-hidden">{stateText(service)}</span>
            ) : (
              stateText(service)
            )}
          </span>
          {!compact && (
            <span className="service-link">
              {service.has_ui && (
                <a href={serviceHref(service)} target="_blank" rel="noreferrer" className="text-link">
                  Ouvrir<span aria-hidden="true"> ↗</span>
                  <span className="visually-hidden"> {service.name} (nouvel onglet)</span>
                </a>
              )}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

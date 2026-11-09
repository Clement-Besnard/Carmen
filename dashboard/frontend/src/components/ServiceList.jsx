import { translate as t, useI18n } from "../lib/i18n.jsx";
import StatusDot from "./StatusDot.jsx";
import "./ServiceList.css";

/** "http://open-webui:8080/health" -> "open-webui:8080" */
function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function stateText(service) {
  return service.up ? `${service.latency_ms} ms` : t("services.unreachable");
}

/** Quoi verifier quand un service ne repond pas. */
function Diagnostic({ service }) {
  return service.container
    ? t("services.diagContainer", service.container)
    : t("services.diagUrl", service.url);
}

/**
 * Liste des services declares dans config/services.json.
 * `compact` : nom et etat (accueil). Sinon description, adresse, lien, diagnostic.
 * Le lien "Ouvrir" n'apparait que si le service declare un `link`.
 */
export default function ServiceList({ services, compact = false }) {
  useI18n(); // re-rendu au changement de langue
  return (
    <ul className={`service-list${compact ? " service-list--compact" : ""}`}>
      {services.map((service) => (
        <li key={service.id} className="service-row" data-down={!service.up || undefined}>
          <span className="service-main">
            {compact && service.link ? (
              <a href={service.link} target="_blank" rel="noreferrer" className="service-name">
                {service.name}
                <span className="visually-hidden"> {t("common.newTab")}</span>
              </a>
            ) : (
              <span className="service-name">{service.name}</span>
            )}
            {!compact && (service.up ? service.description : true) && (
              <span className={service.up ? "soft" : "service-diagnostic"}>
                {service.up ? service.description : <Diagnostic service={service} />}
              </span>
            )}
          </span>
          {!compact && <span className="service-host mono soft">{hostOf(service.url)}</span>}
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
              {service.link && (
                <a href={service.link} target="_blank" rel="noreferrer" className="text-link">
                  {t("common.open")}
                  <span aria-hidden="true"> ↗</span>
                  <span className="visually-hidden"> {service.name} {t("common.newTab")}</span>
                </a>
              )}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import ServiceList from "../components/ServiceList.jsx";
import { SkeletonRows } from "../components/Skeleton.jsx";
import { api } from "../lib/api.js";
import { clockTime } from "../lib/format.js";
import { useStack } from "../lib/stack.jsx";
import { usePolling } from "../lib/usePolling.js";
import "./pages.css";

const POLL_MS = 10000;

const EXAMPLE = `[
  {
    "name": "Open WebUI",
    "description": "Interface de chat",
    "url": "http://open-webui:8080",
    "link": "http://10.8.0.1:3000",
    "container": "open-webui"
  }
]`;

/** Aucun service declare : on explique comment en ajouter, sans en supposer. */
function NoServices({ file, error }) {
  return (
    <>
      <PageHeader
        title="Services"
        meta={error ? "Fichier de services illisible" : "Aucun service déclaré"}
      />
      <Panel>
        <div className="panel-empty">
          {error ? (
            <>
              <strong>Le fichier des services n'a pas pu être lu</strong>
              <code className="banner-detail">{error}</code>
            </>
          ) : (
            <>
              <strong>Carmen ne surveille aucun service</strong>
              Pour suivre une application qui utilise Ollama, la déclarer dans{" "}
              <code>{file ?? "config/services.json"}</code>. Sans ce fichier, cette section
              reste masquée.
            </>
          )}
          <pre className="code-sample mono">{EXAMPLE}</pre>
          <p>
            <code>url</code> est testée par le dashboard. <code>link</code> (lien « Ouvrir ») et{" "}
            <code>container</code> (diagnostic) sont facultatifs.
          </p>
        </div>
      </Panel>
    </>
  );
}

function DeclaredServices() {
  const { data, error, phase, checkedAt, pending, refresh } = usePolling(api.services, POLL_MS);
  const services = data?.services ?? [];
  const upCount = services.filter((s) => s.up).length;

  const meta =
    phase === "ready"
      ? `${upCount} sur ${services.length} répondent · vérifié à ${clockTime(checkedAt)}`
      : phase === "loading"
        ? "Vérification en cours…"
        : "Vérification impossible";

  return (
    <>
      <PageHeader
        title="Services"
        meta={meta}
        actions={
          <Button onClick={refresh} disabled={pending}>
            {pending ? "Vérification…" : "Revérifier"}
          </Button>
        }
      />
      <div className="stack">
        <Panel>
          {phase === "loading" && <SkeletonRows count={3} label="Vérification des services" />}
          {phase === "unavailable" && (
            <p className="panel-empty">
              <strong>Le dashboard n'a pas pu vérifier les services</strong>
              {error?.message}
            </p>
          )}
          {data && <ServiceList services={services} />}
        </Panel>
        <p className="page-footnote">
          Un service « répond » dès qu'il renvoie une réponse HTTP au dashboard. Vérification
          toutes les {POLL_MS / 1000} s.
        </p>
      </div>
    </>
  );
}

export default function Services() {
  const { config, hasServices } = useStack();

  if (!config) {
    return (
      <>
        <PageHeader title="Services" meta="Lecture de la configuration…" />
        <Panel>
          <SkeletonRows count={3} label="Lecture de la configuration" />
        </Panel>
      </>
    );
  }

  if (!hasServices || config.services_error) {
    // Chemin relatif au repo : c'est la qu'on edite le fichier, pas dans le conteneur.
    const file = config.services_file?.startsWith(`${config.stack_dir}/`)
      ? config.services_file.slice(config.stack_dir.length + 1)
      : config.services_file;
    return <NoServices file={file} error={config.services_error} />;
  }

  return <DeclaredServices />;
}

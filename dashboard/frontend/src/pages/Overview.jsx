import GpuPanel from "../components/GpuPanel.jsx";
import ModelTable from "../components/ModelTable.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import ServiceList from "../components/ServiceList.jsx";
import { SkeletonRows } from "../components/Skeleton.jsx";
import { api } from "../lib/api.js";
import { gigabytesRound } from "../lib/format.js";
import { Link } from "../lib/router.jsx";
import { useStack } from "../lib/stack.jsx";
import { usePolling } from "../lib/usePolling.js";
import "./pages.css";

const SERVICES_POLL_MS = 15000;

function ModelsPanel() {
  const { phase, models, diskTotal } = useStack();
  return (
    <Panel
      title="Modèles"
      titleId="overview-models"
      meta={
        phase === "ready"
          ? `${models.length} modèle${models.length > 1 ? "s" : ""} · ${gigabytesRound(diskTotal)} Go sur disque`
          : null
      }
      actions={
        <Link to="/modeles" className="text-link">
          Tout voir
        </Link>
      }
    >
      {phase === "loading" && <SkeletonRows label="Chargement des modèles" />}
      {phase === "unavailable" && (
        <p className="panel-empty">Liste indisponible tant qu'Ollama ne répond pas.</p>
      )}
      {phase === "ready" && models.length === 0 && (
        <p className="panel-empty">
          <strong>Aucun modèle installé</strong>
          Récupérer un modèle avec <code>docker exec ollama ollama pull qwen3:8b</code>.
        </p>
      )}
      {phase === "ready" && models.length > 0 && <ModelTable models={models} compact />}
    </Panel>
  );
}

/** Monte seulement si des services sont declares : pas de requete sinon. */
function ServicesPanel() {
  const services = usePolling(api.services, SERVICES_POLL_MS);
  const list = services.data?.services ?? [];
  const upCount = list.filter((s) => s.up).length;
  return (
    <Panel
      title="Services"
      titleId="overview-services"
      meta={services.data ? `${upCount} sur ${list.length}` : null}
      actions={
        <Link to="/services" className="text-link">
          Détails
        </Link>
      }
    >
      {services.phase === "loading" && <SkeletonRows count={2} label="Vérification des services" />}
      {services.phase === "unavailable" && (
        <p className="panel-empty">Impossible de vérifier les services.</p>
      )}
      {services.data && <ServiceList services={list} compact />}
    </Panel>
  );
}

export default function Overview() {
  const { hasServices } = useStack();

  return (
    <>
      <PageHeader
        title="Vue d'ensemble"
      />
      <div className="stack">
        <GpuPanel />
        {hasServices ? (
          <div className="split">
            <ModelsPanel />
            <ServicesPanel />
          </div>
        ) : (
          <ModelsPanel />
        )}
      </div>
    </>
  );
}

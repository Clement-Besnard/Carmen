import GpuPanel from "../components/GpuPanel.jsx";
import ModelTable from "../components/ModelTable.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import ServiceList from "../components/ServiceList.jsx";
import { SkeletonRows } from "../components/Skeleton.jsx";
import { api } from "../lib/api.js";
import { gbUnit, gigabytesRound } from "../lib/format.js";
import { useI18n } from "../lib/i18n.jsx";
import { Link } from "../lib/router.jsx";
import { useStack } from "../lib/stack.jsx";
import { usePolling } from "../lib/usePolling.js";
import "./pages.css";

const SERVICES_POLL_MS = 15000;

function ModelsPanel() {
  const { phase, models, diskTotal } = useStack();
  const { t } = useI18n();
  return (
    <Panel
      title={t("nav.models")}
      titleId="overview-models"
      meta={
        phase === "ready"
          ? t("overview.modelsMeta", models.length, gigabytesRound(diskTotal), gbUnit())
          : null
      }
      actions={
        <Link to="/modeles" className="text-link">
          {t("overview.seeAll")}
        </Link>
      }
    >
      {phase === "loading" && <SkeletonRows label={t("overview.loadingModels")} />}
      {phase === "unavailable" && (
        <p className="panel-empty">{t("overview.modelsUnavailable")}</p>
      )}
      {phase === "ready" && models.length === 0 && (
        <p className="panel-empty">
          <strong>{t("overview.noModels")}</strong>
          {t("overview.noModelsBody")}
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
  const { t } = useI18n();
  return (
    <Panel
      title={t("nav.services")}
      titleId="overview-services"
      meta={services.data ? t("overview.servicesMeta", upCount, list.length) : null}
      actions={
        <Link to="/services" className="text-link">
          {t("overview.details")}
        </Link>
      }
    >
      {services.phase === "loading" && (
        <SkeletonRows count={2} label={t("overview.checkingServices")} />
      )}
      {services.phase === "unavailable" && (
        <p className="panel-empty">{t("overview.servicesUnavailable")}</p>
      )}
      {services.data && <ServiceList services={list} compact />}
    </Panel>
  );
}

export default function Overview() {
  const { hasServices } = useStack();
  const { t } = useI18n();

  return (
    <>
      <PageHeader title={t("overview.title")} />
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

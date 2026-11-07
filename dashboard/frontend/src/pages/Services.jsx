import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import ServiceList from "../components/ServiceList.jsx";
import { SkeletonRows } from "../components/Skeleton.jsx";
import { api } from "../lib/api.js";
import { clockTime } from "../lib/format.js";
import { usePolling } from "../lib/usePolling.js";
import "./pages.css";

const POLL_MS = 10000;

export default function Services() {
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
          {phase === "loading" && <SkeletonRows count={4} label="Vérification des services" />}
          {phase === "unavailable" && (
            <p className="panel-empty">
              <strong>Le dashboard n'a pas pu vérifier les services</strong>
              {error?.message}
            </p>
          )}
          {data && <ServiceList services={services} />}
        </Panel>
        <p className="page-footnote">
          Un service « répond » dès qu'il renvoie une réponse HTTP au dashboard, sur le réseau
          Docker. Vérification toutes les {POLL_MS / 1000} s.
        </p>
      </div>
    </>
  );
}

import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import ServiceList from "../components/ServiceList.jsx";
import { SkeletonRows } from "../components/Skeleton.jsx";
import { api } from "../lib/api.js";
import { clockTime } from "../lib/format.js";
import { useI18n } from "../lib/i18n.jsx";
import { useStack } from "../lib/stack.jsx";
import { usePolling } from "../lib/usePolling.js";
import "./pages.css";

const POLL_MS = 10000;

const example = (description) => `[
  {
    "name": "Open WebUI",
    "description": "${description}",
    "url": "http://open-webui:8080",
    "link": "http://10.8.0.1:3000",
    "container": "open-webui"
  }
]`;

/** Aucun service declare : on explique comment en ajouter, sans en supposer. */
function NoServices({ file, error }) {
  const { t } = useI18n();
  return (
    <>
      <PageHeader
        title={t("services.title")}
        meta={error ? t("services.badFileMeta") : t("services.noneMeta")}
      />
      <Panel>
        <div className="panel-empty">
          {error ? (
            <>
              <strong>{t("services.badFile")}</strong>
              <code className="banner-detail">{error}</code>
            </>
          ) : (
            <>
              <strong>{t("services.none")}</strong>
              {t("services.noneBody", file ?? "config/services.json")}
            </>
          )}
          <pre className="code-sample mono">{example(t("services.exampleDescription"))}</pre>
          <p>{t("services.fields")}</p>
        </div>
      </Panel>
    </>
  );
}

function DeclaredServices() {
  const { data, error, phase, checkedAt, pending, refresh } = usePolling(api.services, POLL_MS);
  const services = data?.services ?? [];
  const upCount = services.filter((s) => s.up).length;
  const { t } = useI18n();

  const meta =
    phase === "ready"
      ? t("services.meta", upCount, services.length, clockTime(checkedAt))
      : phase === "loading"
        ? t("services.checkingMeta")
        : t("services.checkFailedMeta");

  return (
    <>
      <PageHeader
        title={t("services.title")}
        meta={meta}
        actions={
          <Button onClick={refresh} disabled={pending}>
            {pending ? t("services.checking") : t("services.recheck")}
          </Button>
        }
      />
      <div className="stack">
        <Panel>
          {phase === "loading" && <SkeletonRows count={3} label={t("services.checkLabel")} />}
          {phase === "unavailable" && (
            <p className="panel-empty">
              <strong>{t("services.checkFailed")}</strong>
              {error?.message}
            </p>
          )}
          {data && <ServiceList services={services} />}
        </Panel>
        <p className="page-footnote">{t("services.footnote", POLL_MS / 1000)}</p>
      </div>
    </>
  );
}

export default function Services() {
  const { config, hasServices } = useStack();
  const { t } = useI18n();

  if (!config) {
    return (
      <>
        <PageHeader title={t("services.title")} meta={t("services.readingConfig")} />
        <Panel>
          <SkeletonRows count={3} label={t("settings.reading")} />
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

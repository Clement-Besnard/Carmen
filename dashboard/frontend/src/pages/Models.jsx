import { useState } from "react";
import { Notice } from "../components/Banner.jsx";
import ModelTable from "../components/ModelTable.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import { SkeletonRows } from "../components/Skeleton.jsx";
import { useI18n } from "../lib/i18n.jsx";
import { useStack } from "../lib/stack.jsx";
import "./pages.css";

export default function Models() {
  const { phase, models, status } = useStack();
  const [query, setQuery] = useState("");
  const { t } = useI18n();

  const needle = query.trim().toLowerCase();
  const visible = needle ? models.filter((m) => m.name.toLowerCase().includes(needle)) : models;

  return (
    <>
      <PageHeader
        title={t("models.title")}
        actions={
          <>
            {/* Repere discret : la version d'Ollama qui sert ces modeles. */}
            {status?.version && (
              <span className="page-version mono">Ollama {status.version}</span>
            )}
            {models.length > 4 && (
              <>
                <label htmlFor="model-filter" className="visually-hidden">
                  {t("models.filterLabel")}
                </label>
                <input
                  id="model-filter"
                  type="search"
                  className="search-field"
                  placeholder={t("models.filter")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </>
            )}
          </>
        }
      />
      <div className="stack">
        <Notice>{t("models.notice")}</Notice>
        <Panel>
          {phase === "loading" && (
            <SkeletonRows count={4} label={t("overview.loadingModels")} />
          )}
          {phase === "unavailable" && (
            <p className="panel-empty">
              <strong>{t("models.unavailable")}</strong>
              {t("models.unavailableBody")}
            </p>
          )}
          {phase === "ready" && models.length === 0 && (
            <p className="panel-empty">
              <strong>{t("models.none")}</strong>
              {t("models.noneBody")}
            </p>
          )}
          {phase === "ready" && models.length > 0 && visible.length === 0 && (
            <p className="panel-empty">{t("models.noMatch", query)}</p>
          )}
          {phase === "ready" && visible.length > 0 && <ModelTable models={visible} />}
        </Panel>
        <p className="page-footnote">{t("models.footnote")}</p>
      </div>
    </>
  );
}

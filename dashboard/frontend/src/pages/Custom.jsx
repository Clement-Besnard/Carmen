import { useCallback, useEffect, useState } from "react";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import Skeleton, { SkeletonRows } from "../components/Skeleton.jsx";
import { api } from "../lib/api.js";
import { clockTime } from "../lib/format.js";
import { useI18n } from "../lib/i18n.jsx";
import { Link, useLeaveGuard } from "../lib/router.jsx";
import { useStack } from "../lib/stack.jsx";
import "./pages.css";
import "./Custom.css";

function CustomNav({ customs, selected }) {
  const { t } = useI18n();
  return (
    <Panel title={t("custom.list")} titleId="custom-list">
      <ul className="custom-nav">
        {customs.map((custom) => (
          <li key={custom.name}>
            <Link
              to={`/custom/${encodeURIComponent(custom.name)}`}
              className="custom-nav-link"
              aria-current={custom.name === selected ? "page" : undefined}
            >
              <span className="mono">{custom.name}</span>
              <span className="soft mono">{custom.base}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ModelfileFacts({ custom }) {
  const params = Object.entries(custom.parameters ?? {});
  const { t } = useI18n();
  return (
    <Panel title={t("custom.modelfile")} titleId="custom-modelfile">
      <dl className="facts">
        <div>
          <dt>{t("custom.base")}</dt>
          <dd className="mono">{custom.base}</dd>
        </div>
        {params.map(([key, value]) => (
          <div key={key}>
            <dt className="mono">{key}</dt>
            <dd className="mono">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="facts-path mono soft">{custom.modelfile_path}</p>
    </Panel>
  );
}

function Editor({ custom, onSaved }) {
  const { busy, runOn } = useStack();
  const [draft, setDraft] = useState(custom.prompt);
  const [action, setAction] = useState(null); // "save" | "rebuild" | null
  // { key, at } : on garde la cle, pas le texte, pour suivre un changement de langue.
  const [result, setResult] = useState(null);
  const { t } = useI18n();

  const dirty = draft !== custom.prompt;
  const working = busy === custom.name;
  useLeaveGuard(dirty, t("custom.leave"));

  const run = useCallback(
    async (kind) => {
      setAction(kind);
      try {
        await runOn(custom.name, async () => {
          const updated = await api.saveCustom(custom.name, { prompt: draft });
          onSaved(updated);
          setDraft(updated.prompt);
          if (kind === "rebuild") {
            const rebuilt = await api.rebuild(custom.name);
            setResult({
              key: rebuilt.reloaded ? "custom.rebuiltReloaded" : "custom.rebuilt",
              at: new Date(),
            });
          } else {
            setResult({ key: "custom.saved", at: new Date() });
          }
        });
      } catch {
        // L'erreur est affichee par le bandeau global.
        setResult(null);
      } finally {
        setAction(null);
      }
    },
    [custom.name, draft, onSaved, runOn]
  );

  // Ctrl/Cmd + S : enregistrer sans rebuild.
  function onKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      if (dirty && !working) run("save");
    }
  }

  const state = working
    ? action === "rebuild"
      ? t("custom.rebuilding")
      : t("custom.saving")
    : dirty
      ? t("custom.dirty")
      : result
        ? t("custom.resultAt", t(result.key), clockTime(result.at))
        : t("custom.upToDate");

  return (
    <Panel
      title={t("custom.prompt")}
      titleId="custom-prompt"
      meta={<span className="mono">{custom.prompt_path}</span>}
      className="editor"
    >
      <label htmlFor="prompt-editor" className="visually-hidden">
        {t("custom.promptLabel", custom.name)}
      </label>
      <textarea
        id="prompt-editor"
        className="editor-field mono"
        value={draft}
        spellCheck={false}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={working}
      />
      <footer className="editor-foot">
        <p className="soft" aria-live="polite">
          <span data-dirty={dirty || undefined} className="editor-state">
            {state}
          </span>{" "}
          · {t("custom.chars", draft.length)}
        </p>
        <div className="editor-actions">
          <Button disabled={!dirty || working} onClick={() => run("save")}>
            {working && action === "save" ? t("custom.saving") : t("custom.save")}
          </Button>
          <Button variant="primary" disabled={working} onClick={() => run("rebuild")}>
            {working && action === "rebuild"
              ? t("custom.rebuildBusy")
              : dirty
                ? t("custom.saveAndRebuild")
                : t("custom.rebuild")}
          </Button>
        </div>
      </footer>
    </Panel>
  );
}

export default function Custom({ name }) {
  const [customs, setCustoms] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const { t } = useI18n();

  const load = useCallback(() => {
    setLoadError(null);
    api
      .customModels()
      .then((data) => setCustoms(data.models))
      .catch((err) => setLoadError(err));
  }, []);

  useEffect(load, [load]);

  const selected = customs?.find((c) => c.name === name) ?? (name ? null : customs?.[0]);

  // /custom tout court : on affiche le premier modele, URL comprise.
  useEffect(() => {
    if (!name && customs?.[0]) {
      window.history.replaceState(null, "", `/custom/${encodeURIComponent(customs[0].name)}`);
    }
  }, [name, customs]);

  const onSaved = useCallback((updated) => {
    setCustoms((prev) => prev.map((c) => (c.name === updated.name ? updated : c)));
  }, []);

  if (loadError) {
    return (
      <>
        <PageHeader title={t("custom.title")} meta={t("custom.readFailedMeta")} />
        <Panel>
          <p className="panel-empty">
            <strong>{t("custom.readFailed")}</strong>
            {loadError.message}{" "}
            <Button size="small" onClick={load}>
              {t("common.retry")}
            </Button>
          </p>
        </Panel>
      </>
    );
  }

  if (!customs) {
    return (
      <>
        <PageHeader title={t("custom.title")} meta={t("custom.readingMeta")} />
        <div className="custom-layout">
          <Panel>
            <SkeletonRows count={2} label={t("custom.loading")} />
          </Panel>
          <Panel>
            <div className="editor-skeleton">
              <Skeleton width="70%" />
              <Skeleton width="55%" />
              <Skeleton width="62%" />
            </div>
          </Panel>
        </div>
      </>
    );
  }

  if (customs.length === 0) {
    return (
      <>
        <PageHeader title={t("custom.title")} />
        <Panel>
          <p className="panel-empty">
            <strong>{t("custom.none")}</strong>
            {t("custom.noneBody")}
          </p>
        </Panel>
      </>
    );
  }

  if (!selected) {
    return (
      <>
        <PageHeader title={t("custom.title")} meta={t("custom.notFound", name)} />
        <div className="custom-layout">
          <CustomNav customs={customs} selected={null} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={selected.name} mono crumb={t("custom.crumb")} />
      <div className="custom-layout">
        <div className="stack">
          <CustomNav customs={customs} selected={selected.name} />
          <ModelfileFacts custom={selected} />
        </div>
        {/* key : un nouvel editeur (et un nouveau brouillon) par modele. */}
        <Editor key={selected.name} custom={selected} onSaved={onSaved} />
      </div>
    </>
  );
}

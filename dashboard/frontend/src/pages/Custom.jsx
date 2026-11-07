import { useCallback, useEffect, useState } from "react";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import Skeleton, { SkeletonRows } from "../components/Skeleton.jsx";
import { api } from "../lib/api.js";
import { clockTime } from "../lib/format.js";
import { Link, useLeaveGuard } from "../lib/router.jsx";
import { useStack } from "../lib/stack.jsx";
import "./pages.css";
import "./Custom.css";

const LEAVE_MESSAGE = "Le prompt a des modifications non enregistrées. Quitter quand même ?";

function CustomNav({ customs, selected }) {
  return (
    <Panel title="Modèles" titleId="custom-list">
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
  return (
    <Panel title="Modelfile" titleId="custom-modelfile">
      <dl className="facts">
        <div>
          <dt>Base</dt>
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
  const [result, setResult] = useState(null); // { text, at }

  const dirty = draft !== custom.prompt;
  const working = busy === custom.name;
  useLeaveGuard(dirty, LEAVE_MESSAGE);

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
              text: rebuilt.reloaded ? "Rebuild terminé, modèle rechargé en VRAM" : "Rebuild terminé",
              at: new Date(),
            });
          } else {
            setResult({ text: "Enregistré", at: new Date() });
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
      ? "Rebuild en cours… le modèle est recréé dans Ollama."
      : "Enregistrement…"
    : dirty
      ? "Modifié, non enregistré"
      : result
        ? `${result.text} à ${clockTime(result.at)}`
        : "À jour";

  return (
    <Panel
      title="Prompt système"
      titleId="custom-prompt"
      meta={<span className="mono">{custom.prompt_path}</span>}
      className="editor"
    >
      <label htmlFor="prompt-editor" className="visually-hidden">
        Prompt système de {custom.name}
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
          · {draft.length} caractères
        </p>
        <div className="editor-actions">
          <Button disabled={!dirty || working} onClick={() => run("save")}>
            {working && action === "save" ? "Enregistrement…" : "Enregistrer"}
          </Button>
          <Button variant="primary" disabled={working} onClick={() => run("rebuild")}>
            {working && action === "rebuild" ? "Rebuild…" : dirty ? "Enregistrer et rebuild" : "Rebuild"}
          </Button>
        </div>
      </footer>
    </Panel>
  );
}

export default function Custom({ name }) {
  const [customs, setCustoms] = useState(null);
  const [loadError, setLoadError] = useState(null);

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
        <PageHeader title="Modèles custom" meta="Lecture impossible" />
        <Panel>
          <p className="panel-empty">
            <strong>Les modèles custom n'ont pas pu être lus</strong>
            {loadError.message}{" "}
            <Button size="small" onClick={load}>
              Réessayer
            </Button>
          </p>
        </Panel>
      </>
    );
  }

  if (!customs) {
    return (
      <>
        <PageHeader title="Modèles custom" meta="Lecture des Modelfiles…" />
        <div className="custom-layout">
          <Panel>
            <SkeletonRows count={2} label="Chargement des modèles custom" />
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
        <PageHeader title="Modèles custom" />
        <Panel>
          <p className="panel-empty">
            <strong>Aucun modèle custom</strong>
            Un modèle custom, c'est un prompt dans <code>prompts/&lt;nom&gt;.md</code> et un{" "}
            <code>modelfiles/&lt;nom&gt;.Modelfile</code>. Créer les deux, puis revenir ici pour
            l'éditer et le reconstruire.
          </p>
        </Panel>
      </>
    );
  }

  if (!selected) {
    return (
      <>
        <PageHeader title="Modèles custom" meta={`Aucun modèle custom ne s'appelle « ${name} ».`} />
        <div className="custom-layout">
          <CustomNav customs={customs} selected={null} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={selected.name} mono crumb="Modèles custom /" />
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

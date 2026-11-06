import { useCallback, useEffect, useRef, useState } from "react";
import { api, formatBytes } from "./api.js";
import ModelCard from "./ModelCard.jsx";
import CustomEditor from "./CustomEditor.jsx";
import {
  LogoIcon,
  SunIcon,
  MoonIcon,
  CpuIcon,
  FolderIcon,
  AlertIcon,
  CloseIcon,
} from "./icons.jsx";

const POLL_MS = 3000;

function initialTheme() {
  try {
    const saved = localStorage.getItem("llm-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* sans localStorage : le script inline a déjà choisi un thème */
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export default function App() {
  const [models, setModels] = useState([]);
  const [vram, setVram] = useState({ used: 0, total: 0 });
  const [customs, setCustoms] = useState([]);
  const [version, setVersion] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  // { name, phase: "save" | "rebuild" | "load" } du modèle concerné, ou null.
  const [busy, setBusy] = useState(null);
  const [theme, setTheme] = useState(initialTheme);

  // Registre des sauvegardes Ctrl/Cmd+S, un par modèle custom.
  const savers = useRef(new Map());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("llm-theme", theme);
    } catch {
      /* sans localStorage, le thème ne sera pas retenu */
    }
  }, [theme]);

  useEffect(() => {
    function onKey(event) {
      if (
        !((event.ctrlKey || event.metaKey) &&
          (event.key === "s" || event.key === "S"))
      )
        return;
      event.preventDefault();
      for (const saver of savers.current.values()) saver();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const registerSaver = useCallback((name, saver) => {
    if (saver) savers.current.set(name, saver);
    else savers.current.delete(name);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await api.models();
      setModels(data.models);
      setVram({ used: data.vram_used, total: data.vram_total });
      setConnected(true);
      setError(null);
    } catch (err) {
      setConnected(false);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh();
    api
      .status()
      .then((s) => setVersion(s.version))
      .catch(() => {});
    api
      .customModels()
      .then((d) => setCustoms(d.models))
      .catch(() => {});
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  async function runOn(name, phase, action) {
    setBusy({ name, phase });
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err.message);
      // On propage pour que l'éditeur ne marque pas "enregistré" en cas d'échec.
      throw err;
    } finally {
      setBusy(null);
      refresh();
    }
  }

  const toggle = (model) =>
    runOn(model.name, "load", () =>
      model.loaded ? api.unload(model.name) : api.load(model.name)
    );

  const percent = vram.total ? Math.min(100, (vram.used / vram.total) * 100) : 0;
  const loadedCount = models.filter((m) => m.loaded).length;

  return (
    <div className="page">
      <header>
        <div className="brand">
          <span className="logo" aria-hidden="true">
            <LogoIcon size={23} />
          </span>
          <div className="brand-text">
            <h1>llm-stack</h1>
            <p className="subtitle">
              <span className={`live-dot${connected ? "" : " offline"}`} />
              <span>{version ? `Ollama ${version}` : "connexion…"}</span>
              <span className="sep" aria-hidden="true">●</span>
              <span>
                {models.length} modèle{models.length > 1 ? "s" : ""}
              </span>
              {models.length > 0 && (
                <span className="sep" aria-hidden="true">●</span>
              )}
              {models.length > 0 && (
                <span>
                  {loadedCount} chargé{loadedCount > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="header-right">
          <div className="vram">
            <div className="vram-label">
              <span className="vram-name">
                <CpuIcon size={14} />
                <span>VRAM</span>
              </span>
              <span className="mono">
                {formatBytes(vram.used)} / {formatBytes(vram.total)}
              </span>
            </div>
            <div
              className="vram-track"
              role="progressbar"
              aria-label="VRAM utilisée"
              aria-valuemin={0}
              aria-valuemax={vram.total || 100}
              aria-valuenow={vram.used}
            >
              <div className="vram-fill" style={{ width: `${percent}%` }} />
            </div>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={
              theme === "dark" ? "Passer en thème clair" : "Passer en thème sombre"
            }
            title={theme === "dark" ? "Thème clair" : "Thème sombre"}
          >
            {theme === "dark" ? <SunIcon size={17} /> : <MoonIcon size={17} />}
          </button>
        </div>
      </header>

      {error && (
        <div className="banner error" role="alert">
          <span className="banner-msg">
            <AlertIcon size={16} />
            <span>{error}</span>
          </span>
          <button
            type="button"
            className="icon-btn small"
            onClick={() => setError(null)}
            aria-label="Fermer le message d'erreur"
          >
            <CloseIcon size={15} />
          </button>
        </div>
      )}

      {customs.length > 0 && (
        <section>
          <div className="section-head">
            <h2>
              <FolderIcon size={14} />
              <span>Prompt système</span>
            </h2>
            <span className="count-badge">
              {customs.length}
            </span>
          </div>
          <p className="hint">
            Le prompt est écrit dans <code>prompts/&lt;nom&gt;.md</code>, puis le
            Modelfile est régénéré et le modèle recréé dans Ollama.
          </p>
          {customs.map((custom) => (
            <CustomEditor
              key={custom.name}
              custom={custom}
              busy={busy?.name === custom.name}
              phase={busy?.phase}
              disabled={busy !== null && busy.name !== custom.name}
              registerSaver={registerSaver}
              onSave={(text) =>
                runOn(custom.name, "save", async () => {
                  const updated = await api.saveCustom(custom.name, {
                    prompt: text,
                  });
                  setCustoms((prev) =>
                    prev.map((c) => (c.name === custom.name ? updated : c))
                  );
                })
              }
              onRebuild={(text) =>
                runOn(custom.name, "rebuild", async () => {
                  const updated = await api.saveCustom(custom.name, {
                    prompt: text,
                  });
                  setCustoms((prev) =>
                    prev.map((c) => (c.name === custom.name ? updated : c))
                  );
                  await api.rebuild(custom.name);
                })
              }
            />
          ))}
        </section>
      )}

      <section>
        <div className="section-head">
          <h2>
            <CpuIcon size={14} />
            <span>Modèles</span>
          </h2>
          <span className="count-badge">{models.length}</span>
        </div>
        {models.length === 0 ? (
          <div className="empty">
            Aucun modèle installé dans Ollama.
          </div>
        ) : (
          <div className="grid">
            {models.map((model) => (
              <ModelCard
                key={model.name}
                model={model}
                busy={busy?.name === model.name}
                disabled={busy !== null && busy.name !== model.name}
                onToggle={() => toggle(model)}
              />
            ))}
          </div>
        )}
      </section>

      <footer className="footer">
        <span className="foot-item">
          <LogoIcon size={13} />
          <span>llm-stack — dashboard Ollama</span>
        </span>
        <span>Rafraîchi toutes les {POLL_MS / 1000} s</span>
      </footer>
    </div>
  );
}

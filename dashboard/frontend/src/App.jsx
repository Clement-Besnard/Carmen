import { useCallback, useEffect, useState } from "react";
import { api, formatBytes } from "./api.js";
import ModelCard from "./ModelCard.jsx";
import CustomEditor from "./CustomEditor.jsx";

const POLL_MS = 3000;

export default function App() {
  const [models, setModels] = useState([]);
  const [vram, setVram] = useState({ used: 0, total: 0 });
  const [customs, setCustoms] = useState([]);
  const [version, setVersion] = useState(null);
  const [error, setError] = useState(null);
  // Nom du modele dont une operation longue est en cours (load/unload/rebuild).
  const [busy, setBusy] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.models();
      setModels(data.models);
      setVram({ used: data.vram_used, total: data.vram_total });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh();
    api.status().then((s) => setVersion(s.version)).catch(() => {});
    api.customModels().then((d) => setCustoms(d.models)).catch(() => {});
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  async function runOn(name, action) {
    setBusy(name);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
      refresh();
    }
  }

  const toggle = (model) =>
    runOn(model.name, () =>
      model.loaded ? api.unload(model.name) : api.load(model.name)
    );

  const percent = vram.total ? Math.min(100, (vram.used / vram.total) * 100) : 0;

  return (
    <div className="page">
      <header>
        <div>
          <h1>llm-stack</h1>
          <p className="subtitle">
            {version ? `Ollama ${version}` : "connexion…"} · {models.length} modèles
          </p>
        </div>
        <div className="vram">
          <div className="vram-label">
            <span>VRAM</span>
            <span className="mono">
              {formatBytes(vram.used)} / {formatBytes(vram.total)}
            </span>
          </div>
          <div className="vram-track">
            <div className="vram-fill" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </header>

      {error && <div className="banner error">{error}</div>}

      <section>
        <h2>Modèles</h2>
        <div className="grid">
          {models.map((model) => (
            <ModelCard
              key={model.name}
              model={model}
              busy={busy === model.name}
              disabled={busy !== null && busy !== model.name}
              onToggle={() => toggle(model)}
            />
          ))}
        </div>
      </section>

      {customs.length > 0 && (
        <section>
          <h2>Modèles custom</h2>
          <p className="hint">
            Le prompt système est écrit dans <code>prompts/&lt;nom&gt;.md</code>, puis le
            Modelfile est régénéré et le modèle recréé dans Ollama.
          </p>
          {customs.map((custom) => (
            <CustomEditor
              key={custom.name}
              custom={custom}
              busy={busy === custom.name}
              disabled={busy !== null && busy !== custom.name}
              onSave={(prompt) =>
                runOn(custom.name, async () => {
                  const updated = await api.saveCustom(custom.name, { prompt });
                  setCustoms((prev) =>
                    prev.map((c) => (c.name === custom.name ? updated : c))
                  );
                })
              }
              onRebuild={(prompt) =>
                runOn(custom.name, async () => {
                  const updated = await api.saveCustom(custom.name, { prompt });
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
    </div>
  );
}

import { formatBytes } from "./api.js";

export default function ModelCard({ model, busy, disabled, onToggle }) {
  const meta = [model.parameter_size, model.quantization, formatBytes(model.size)]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className={`card ${model.loaded ? "on" : ""}`}>
      <div className="card-head">
        <div>
          <h3>
            {model.name}
            {model.is_custom && <span className="tag">custom</span>}
          </h3>
          <p className="meta mono">{meta}</p>
        </div>
        <button
          className={`toggle ${model.loaded ? "on" : ""}`}
          onClick={onToggle}
          disabled={busy || disabled}
          aria-pressed={model.loaded}
          aria-label={model.loaded ? `Décharger ${model.name}` : `Charger ${model.name}`}
        >
          <span className="knob" />
        </button>
      </div>
      <p className="state">
        {busy ? (
          <span className="pending">opération en cours…</span>
        ) : model.loaded ? (
          <span className="active">en VRAM · {formatBytes(model.size_vram)}</span>
        ) : (
          <span className="idle">déchargé</span>
        )}
      </p>
    </article>
  );
}

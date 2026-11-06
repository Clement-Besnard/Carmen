import { formatBytes } from "./api.js";

export default function ModelCard({ model, busy, disabled, onToggle }) {
  const chips = [
    model.size && formatBytes(model.size),
    model.parameter_size,
    model.quantization,
  ].filter(Boolean);

  return (
    <article className={`card${model.loaded ? " on" : ""}`}>
      <div className="card-head">
        <div className="card-id">
          <h3>
            {model.name}
            {model.is_custom && <span className="tag">custom</span>}
          </h3>
          {chips.length > 0 && (
            <div className="chips">
              {chips.map((chip, i) => (
                <span className="chip mono" key={i}>
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className={`toggle${model.loaded ? " on" : ""}`}
          role="switch"
          aria-checked={model.loaded}
          aria-label={
            model.loaded ? `Décharger ${model.name}` : `Charger ${model.name}`
          }
          onClick={onToggle}
          disabled={busy || disabled}
        >
          <span className="knob" aria-hidden="true" />
        </button>
      </div>
      <p
        className={`state ${busy ? "pending" : model.loaded ? "active" : "idle"}`}
      >
        <span className="dot" aria-hidden="true" />
        {busy ? (
          "opération en cours…"
        ) : model.loaded ? (
          <>
            en VRAM
            {model.size_vram && (
              <span className="state-val">· {formatBytes(model.size_vram)}</span>
            )}
          </>
        ) : (
          "déchargé"
        )}
      </p>
    </article>
  );
}

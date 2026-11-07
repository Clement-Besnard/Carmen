import { useStack } from "../lib/stack.jsx";
import { gigabytes, residency, splitModelName } from "../lib/format.js";
import Toggle from "./Toggle.jsx";
import "./ModelTable.css";

/** Ce qu'on affiche sous le nom : l'operation en cours, sinon l'etat. */
function rowStatus(model, { busy, loadedModel }) {
  if (busy === model.name) {
    if (model.loaded) return "Déchargement…";
    return loadedModel
      ? `Chargement… remplace ${splitModelName(loadedModel.name).base}`
      : "Chargement…";
  }
  const parts = [];
  if (model.family) parts.push(model.family);
  parts.push(model.loaded ? residency(model.expires_at) ?? "chargé" : "au repos");
  return parts.join(" · ");
}

function ModelName({ name, custom }) {
  const { base, tag } = splitModelName(name);
  return (
    <span className="model-name mono">
      {base}
      {tag && tag !== "latest" && <span className="soft">:{tag}</span>}
      {custom && <span className="model-custom">custom</span>}
    </span>
  );
}

/**
 * Liste des modeles avec bascule charger / decharger.
 * `compact` : nom, taille, VRAM (accueil). Sinon toutes les colonnes.
 */
export default function ModelTable({ models, compact = false }) {
  const stack = useStack();
  const { busy, toggleModel } = stack;
  const busyModel = models.find((m) => m.name === busy);

  return (
    <div className={`model-table${compact ? " model-table--compact" : ""}`}>
      <div className="model-row model-head" aria-hidden="true">
        <span>Nom</span>
        <span>Taille</span>
        {!compact && <span>Quantif.</span>}
        {!compact && <span>Disque</span>}
        <span>VRAM</span>
        <span />
      </div>
      <ul>
        {models.map((model) => {
          const isBusy = busy === model.name;
          const paused = busy !== null && !isBusy;
          return (
            <li
              key={model.name}
              className="model-row"
              data-busy={isBusy || undefined}
              data-paused={paused || undefined}
            >
              <span className="model-main">
                <ModelName name={model.name} custom={model.is_custom} />
                <span className="model-status soft">{rowStatus(model, stack)}</span>
              </span>
              <span className="model-cell">
                <span className="model-label">Taille </span>
                {model.parameter_size ?? "—"}
              </span>
              {!compact && (
                <span className="model-cell mono">
                  <span className="model-label">Quantif. </span>
                  {model.quantization ?? "—"}
                </span>
              )}
              {!compact && (
                <span className="model-cell mono">
                  <span className="model-label">Disque </span>
                  {gigabytes(model.size)} Go
                </span>
              )}
              <span className={`model-cell mono${model.loaded ? "" : " soft"}`}>
                <span className="model-label">VRAM </span>
                {model.loaded ? `${gigabytes(model.size_vram)} Go` : "—"}
              </span>
              <span className="model-action">
                <Toggle
                  checked={model.loaded}
                  label={`${model.loaded ? "Décharger" : "Charger"} ${model.name}`}
                  busy={isBusy}
                  disabled={paused}
                  onChange={() => toggleModel(model)}
                />
              </span>
            </li>
          );
        })}
      </ul>
      <p className="visually-hidden" aria-live="polite">
        {busyModel ? `${busyModel.name} : ${rowStatus(busyModel, stack)}` : ""}
      </p>
    </div>
  );
}

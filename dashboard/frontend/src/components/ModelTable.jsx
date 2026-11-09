import { useStack } from "../lib/stack.jsx";
import { gbUnit, gigabytes, humanBytes, splitModelName } from "../lib/format.js";
import { translate as t, useI18n } from "../lib/i18n.jsx";
import Toggle from "./Toggle.jsx";
import "./ModelTable.css";

/**
 * Sous le nom : l'operation en cours, sinon le modele d'origine pour un
 * derive (meme poids, autre prompt ou parametres). Rien pour un original.
 */
function rowStatus(model, { busy, loadedModel }) {
  if (busy === model.name) {
    if (model.loaded) return t("table.unloading");
    return loadedModel
      ? t("table.loadingReplaces", splitModelName(loadedModel.name).base)
      : t("table.loading");
  }
  return model.base ? t("common.basedOn", model.base) : null;
}

/** Place sur le disque : un derive ne compte que ce qu'il ajoute. */
function diskLabel(model) {
  return model.base ? humanBytes(model.disk_size) : `${gigabytes(model.disk_size)} ${gbUnit()}`;
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
  useI18n(); // re-rendu au changement de langue
  const { busy, toggleModel } = stack;
  const busyModel = models.find((m) => m.name === busy);

  return (
    <div className={`model-table${compact ? " model-table--compact" : ""}`}>
      <div className="model-row model-head" aria-hidden="true">
        <span>{t("table.name")}</span>
        <span>{t("table.size")}</span>
        {!compact && <span>{t("table.quant")}</span>}
        {!compact && <span>{t("table.disk")}</span>}
        <span>{t("table.vram")}</span>
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
                {rowStatus(model, stack) && (
                  <span className="model-status soft">{rowStatus(model, stack)}</span>
                )}
              </span>
              <span className="model-cell">
                <span className="model-label">{t("table.size")} </span>
                {model.parameter_size ?? "—"}
              </span>
              {!compact && (
                <span className="model-cell mono">
                  <span className="model-label">{t("table.quant")} </span>
                  {model.quantization ?? "—"}
                </span>
              )}
              {!compact && (
                <span
                  className="model-cell mono"
                  title={model.base ? t("table.sharedWith", model.base) : undefined}
                >
                  <span className="model-label">{t("table.disk")} </span>
                  {diskLabel(model)}
                </span>
              )}
              <span className={`model-cell mono${model.loaded ? "" : " soft"}`}>
                <span className="model-label">{t("table.vram")} </span>
                {model.loaded ? `${gigabytes(model.size_vram)} ${gbUnit()}` : "—"}
              </span>
              <span className="model-action">
                <Toggle
                  checked={model.loaded}
                  label={t(model.loaded ? "table.unload" : "table.load", model.name)}
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

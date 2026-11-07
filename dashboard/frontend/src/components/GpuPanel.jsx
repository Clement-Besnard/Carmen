import { useStack } from "../lib/stack.jsx";
import { gigabytes, gigabytesRound, percent, splitModelName } from "../lib/format.js";
import { Link } from "../lib/router.jsx";
import Button from "./Button.jsx";
import Gauge from "./Gauge.jsx";
import Panel from "./Panel.jsx";
import Skeleton from "./Skeleton.jsx";
import "./GpuPanel.css";

/** Etat du GPU : jauge VRAM, modele resident et action pour le liberer. */
export default function GpuPanel() {
  const { phase, vramUsed, vramTotal, loadedModel, busy, stale, toggleModel } = useStack();
  const ready = phase === "ready";
  const pct = Math.round(percent(vramUsed, vramTotal));
  const total = gigabytesRound(vramTotal);

  const meta = ready ? (
    <span className="mono">
      {gigabytes(vramUsed)} / {total} Go · {pct} %
    </span>
  ) : phase === "loading" ? (
    <Skeleton width="9em" />
  ) : (
    <span className="mono">— / — Go</span>
  );

  return (
    <Panel title="GPU" titleId="gpu-title" meta={meta} className="gpu-panel" >
      <div className="gpu-body" data-stale={stale || undefined}>
        <Gauge
          value={ready ? vramUsed : 0}
          max={vramTotal || 1}
          label="VRAM utilisée"
          valueText={ready ? `${gigabytes(vramUsed)} Go sur ${total} Go` : "inconnue"}
        />
        <div className="gpu-resident">
          {phase === "loading" && <Skeleton width="16em" />}
          {phase === "unavailable" && (
            <p className="soft">État du GPU inconnu tant qu'Ollama ne répond pas.</p>
          )}
          {ready && loadedModel && (
            <>
              <p>
                <span className="mono gpu-model">{splitModelName(loadedModel.name).base}</span>{" "}
                <span className="soft">
                  {[
                    loadedModel.base && `basé sur ${loadedModel.base}`,
                    loadedModel.parameter_size,
                    loadedModel.quantization,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </p>
              <Button
                size="small"
                disabled={busy !== null}
                onClick={() => toggleModel(loadedModel)}
              >
                {busy === loadedModel.name ? "Déchargement…" : "Décharger"}
              </Button>
            </>
          )}
          {ready && !loadedModel && (
            <p className="soft">
              Aucun modèle en VRAM, le GPU est au repos.{" "}
              <Link to="/modeles" className="text-link">
                Choisir un modèle
              </Link>
            </p>
          )}
        </div>
      </div>
    </Panel>
  );
}

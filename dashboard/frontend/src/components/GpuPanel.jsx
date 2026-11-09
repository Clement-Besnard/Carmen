import { useStack } from "../lib/stack.jsx";
import { gbUnit, gigabytes, gigabytesRound, percent, splitModelName } from "../lib/format.js";
import { useI18n } from "../lib/i18n.jsx";
import { Link } from "../lib/router.jsx";
import Button from "./Button.jsx";
import Gauge from "./Gauge.jsx";
import Panel from "./Panel.jsx";
import Skeleton from "./Skeleton.jsx";
import "./GpuPanel.css";

/** Etat du GPU : jauge VRAM, modele resident et action pour le liberer. */
export default function GpuPanel() {
  const { phase, vramUsed, vramTotal, loadedModel, busy, stale, toggleModel } = useStack();
  const { t } = useI18n();
  const unit = gbUnit();
  const ready = phase === "ready";
  const pct = Math.round(percent(vramUsed, vramTotal));
  const total = gigabytesRound(vramTotal);

  const meta = ready ? (
    <span className="mono">
      {gigabytes(vramUsed)} / {total} {unit} · {pct} %
    </span>
  ) : phase === "loading" ? (
    <Skeleton width="9em" />
  ) : (
    <span className="mono">— / — {unit}</span>
  );

  return (
    <Panel title="GPU" titleId="gpu-title" meta={meta} className="gpu-panel" >
      <div className="gpu-body" data-stale={stale || undefined}>
        <Gauge
          value={ready ? vramUsed : 0}
          max={vramTotal || 1}
          label={t("gpu.vramUsed")}
          valueText={ready ? t("gpu.valueText", gigabytes(vramUsed), total, unit) : t("common.unknown")}
        />
        <div className="gpu-resident">
          {phase === "loading" && <Skeleton width="16em" />}
          {phase === "unavailable" && (
            <p className="soft">{t("gpu.unavailable")}</p>
          )}
          {ready && loadedModel && (
            <>
              <p>
                <span className="mono gpu-model">{splitModelName(loadedModel.name).base}</span>{" "}
                <span className="soft">
                  {[
                    loadedModel.base && t("common.basedOn", loadedModel.base),
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
                {busy === loadedModel.name ? t("gpu.unloading") : t("gpu.unload")}
              </Button>
            </>
          )}
          {ready && !loadedModel && (
            <p className="soft">
              {t("gpu.idle")}{" "}
              <Link to="/modeles" className="text-link">
                {t("gpu.pick")}
              </Link>
            </p>
          )}
        </div>
      </div>
    </Panel>
  );
}

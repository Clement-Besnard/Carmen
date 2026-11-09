import { useState } from "react";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import { SkeletonRows } from "../components/Skeleton.jsx";
import { api } from "../lib/api.js";
import { useI18n } from "../lib/i18n.jsx";
import { usePolling } from "../lib/usePolling.js";
import "./pages.css";
import "./Settings.css";

const SETTINGS = [
  {
    key: "OLLAMA_BASE_URL",
    field: "ollama_base_url",
    help: (t) => t("settings.help.ollama"),
  },
  {
    key: "STACK_DIR",
    field: "stack_dir",
    help: (t) => t("settings.help.stack"),
  },
  {
    key: "GPU_TOTAL_VRAM_GB",
    field: "gpu_total_vram_gb",
    help: (t) => t("settings.help.vram"),
  },
  {
    key: "SERVICES_FILE",
    field: "services_file",
    help: (t, config) =>
      config.services_error
        ? t("settings.help.servicesError", config.services_error)
        : config.services.length
          ? t(
              "settings.help.servicesDeclared",
              config.services.length,
              config.services.map((s) => s.name).join(", ")
            )
          : t("settings.help.servicesNone"),
  },
];

/**
 * navigator.clipboard n'existe qu'en contexte securise (https ou localhost).
 * Via le VPN en http, on retombe sur l'ancienne methode.
 */
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "absolute";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  if (!ok) throw new Error("copie refusée");
}

function CopyButton({ value, label }) {
  const [state, setState] = useState("idle");
  const { t } = useI18n();
  async function onClick() {
    try {
      await copyText(value);
      setState("done");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2000);
  }
  return (
    <Button variant="ghost" size="small" onClick={onClick} aria-label={t("settings.copyLabel", label)}>
      <span aria-live="polite">
        {state === "done"
          ? t("settings.copied")
          : state === "failed"
            ? t("settings.copyFailed")
            : t("settings.copy")}
      </span>
    </Button>
  );
}

export default function Settings() {
  const { data, error, phase, refresh } = usePolling(api.config);
  const { t } = useI18n();

  return (
    <>
      <PageHeader
        title={t("settings.title")}
        meta={t("settings.meta")}
      />
      <div className="stack">
        <Panel>
          {phase === "loading" && <SkeletonRows count={3} label={t("settings.reading")} />}
          {phase === "unavailable" && (
            <p className="panel-empty">
              <strong>{t("settings.unreadable")}</strong>
              {error?.message}{" "}
              <Button size="small" onClick={refresh}>
                {t("common.retry")}
              </Button>
            </p>
          )}
          {data && (
            <dl className="settings">
              {SETTINGS.map((setting) => {
                const value = String(data[setting.field]);
                return (
                  <div key={setting.key} className="setting">
                    <dt className="mono setting-key">{setting.key}</dt>
                    <dd className="setting-value">
                      <span className="mono">{value}</span>
                      <span className="soft">
                        {setting.help(t, data)}
                      </span>
                    </dd>
                    <dd className="setting-action">
                      <CopyButton value={value} label={setting.key} />
                    </dd>
                  </div>
                );
              })}
            </dl>
          )}
        </Panel>
      </div>
    </>
  );
}

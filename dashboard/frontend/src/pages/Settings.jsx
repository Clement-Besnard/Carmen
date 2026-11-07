import { useState } from "react";
import { Notice } from "../components/Banner.jsx";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import { SkeletonRows } from "../components/Skeleton.jsx";
import { api } from "../lib/api.js";
import { usePolling } from "../lib/usePolling.js";
import "./pages.css";
import "./Settings.css";

const SETTINGS = [
  {
    key: "OLLAMA_BASE_URL",
    field: "ollama_base_url",
    help: "Adresse de l'API Ollama vue par le backend.",
  },
  {
    key: "STACK_DIR",
    field: "stack_dir",
    help: "Dossier où sont lus prompts/ et modelfiles/.",
  },
  {
    key: "GPU_TOTAL_VRAM_GB",
    field: "gpu_total_vram_gb",
    help: "Total affiché dans la jauge VRAM, le conteneur ne peut pas le lire sur le GPU.",
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
    <Button variant="ghost" size="small" onClick={onClick} aria-label={`Copier ${label}`}>
      <span aria-live="polite">
        {state === "done" ? "Copié" : state === "failed" ? "Échec" : "Copier"}
      </span>
    </Button>
  );
}

export default function Settings() {
  const { data, error, phase, refresh } = usePolling(api.config);

  return (
    <>
      <PageHeader
        title="Paramètres"
        meta="Lecture seule. Ces valeurs viennent de l'environnement du conteneur."
      />
      <div className="stack">
        <Panel>
          {phase === "loading" && <SkeletonRows count={3} label="Lecture de la configuration" />}
          {phase === "unavailable" && (
            <p className="panel-empty">
              <strong>Configuration illisible</strong>
              {error?.message}{" "}
              <Button size="small" onClick={refresh}>
                Réessayer
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
                      <span className="soft">{setting.help}</span>
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
        <Notice>
          Pas d'authentification : Nimbus n'écoute que sur 127.0.0.1 et sur le VPN (10.8.0.1).
          Tout client VPN a un accès admin complet.
        </Notice>
      </div>
    </>
  );
}

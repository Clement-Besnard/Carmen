import { useEffect, useState } from "react";
import {
  SaveIcon,
  RebuildIcon,
  RevertIcon,
  CheckIcon,
  FolderIcon,
  Spinner,
} from "./icons.jsx";

const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);
const SHORTCUT = isMac ? "⌘S" : "Ctrl+S";

export default function CustomEditor({
  custom,
  busy,
  phase,
  disabled,
  registerSaver,
  onSave,
  onRebuild,
}) {
  const [prompt, setPrompt] = useState(custom.prompt);
  const [open, setOpen] = useState(true);
  // "saved" | "rebuilt" : retour visuel temporaire après une opération réussie.
  const [flash, setFlash] = useState(null);

  // Le parent remplace l'objet après sauvegarde : on resynchronise le draft.
  useEffect(() => setPrompt(custom.prompt), [custom.prompt]);

  const dirty = prompt !== custom.prompt;

  const chars = prompt.length;
  const words = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  const lines = prompt ? prompt.split("\n").length : 0;
  const params = Object.entries(custom.parameters)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");

  async function handleSave() {
    if (busy || disabled) return;
    try {
      await onSave(prompt);
      setFlash("saved");
    } catch {
      /* l'erreur remonte dans le bannier global */
    }
  }

  async function handleRebuild() {
    if (busy || disabled) return;
    try {
      await onRebuild(prompt);
      setFlash("rebuilt");
    } catch {
      /* l'erreur remonte dans le bannier global */
    }
  }

  // Raccourci Ctrl/Cmd+S : le parent émet la touche, chaque éditeur valide.
  useEffect(() => {
    if (typeof registerSaver !== "function") return undefined;
    registerSaver(custom.name, () => handleSave());
    return () => registerSaver(custom.name, null);
  });

  // Avertit avant de fermer l'onglet avec des modifications non enregistrées.
  useEffect(() => {
    if (!dirty) return undefined;
    function onBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // Le flash "enregistré" disparaît tout seul.
  useEffect(() => {
    if (!flash || busy) return undefined;
    const timer = setTimeout(() => setFlash(null), 3000);
    return () => clearTimeout(timer);
  }, [flash, busy]);

  return (
    <article className={`custom${dirty ? " dirty" : ""}`}>
      <button
        type="button"
        className="custom-head"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="chev" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width={14}
            height={14}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
        <span className="doc" aria-hidden="true">
          <FolderIcon size={15} />
        </span>
        <h3>{custom.name}</h3>
        <span className="meta mono">
          FROM {custom.base}
          {params && ` · ${params}`}
        </span>
        {dirty && <span className="tag warn">non sauvegardé</span>}
      </button>

      {open && (
        <div className="custom-body">
          <label className="sr-only" htmlFor={`prompt-${custom.name}`}>
            Prompt système de {custom.name}
          </label>
          <textarea
            id={`prompt-${custom.name}`}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            spellCheck="false"
            autoCapitalize="off"
            autoCorrect="off"
            rows={18}
          />

          <div className="editor-foot">
            <div className="status" role="status" aria-live="polite">
              {busy ? (
                <span className="pending">
                  <Spinner />
                  {phase === "rebuild"
                    ? "Enregistrement & rebuild…"
                    : "Enregistrement en cours…"}
                </span>
              ) : flash === "rebuilt" ? (
                <span className="ok">
                  <CheckIcon size={14} />
                  Rebuild terminé
                </span>
              ) : flash === "saved" ? (
                <span className="ok">
                  <CheckIcon size={14} />
                  Enregistré
                </span>
              ) : dirty ? (
                <span className="warn">
                  <span className="dot" aria-hidden="true" />
                  Modifié — {SHORTCUT} ou « Enregistrer »
                </span>
              ) : (
                <span className="idle">
                  <span className="dot" aria-hidden="true" />
                  À jour
                </span>
              )}
            </div>
            <div className="counter mono" aria-hidden="true">
              {chars.toLocaleString("fr-FR")} car. · {words} mots · {lines} lignes
            </div>
          </div>

          <div className="actions">
            {dirty && !busy && (
              <button
                type="button"
                className="btn ghost"
                onClick={() => setPrompt(custom.prompt)}
                disabled={disabled}
              >
                <RevertIcon size={15} />
                Réinitialiser
              </button>
            )}
            <span className="path mono">
              <FolderIcon size={13} />
              {custom.prompt_path}
            </span>
            <button
              type="button"
              className="btn secondary"
              onClick={handleRebuild}
              disabled={busy || disabled}
            >
              {busy && phase === "rebuild" ? (
                <Spinner />
              ) : (
                <RebuildIcon size={15} />
              )}
              {busy && phase === "rebuild" ? "Rebuild…" : "Enregistrer & rebuild"}
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={handleSave}
              disabled={busy || disabled || !dirty}
            >
              {busy && phase === "save" ? (
                <Spinner />
              ) : (
                <SaveIcon size={15} />
              )}
              Enregistrer
              <span className="kbd" aria-hidden="true">
                {SHORTCUT}
              </span>
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

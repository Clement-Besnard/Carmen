import { useEffect, useState } from "react";

export default function CustomEditor({ custom, busy, disabled, onSave, onRebuild }) {
  const [prompt, setPrompt] = useState(custom.prompt);
  const [open, setOpen] = useState(false);

  // Le parent remplace l'objet apres sauvegarde : on resynchronise.
  useEffect(() => setPrompt(custom.prompt), [custom.prompt]);

  const dirty = prompt !== custom.prompt;
  const params = Object.entries(custom.parameters)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");

  return (
    <article className="custom">
      <button className="custom-head" onClick={() => setOpen(!open)}>
        <span className={`chevron ${open ? "open" : ""}`}>›</span>
        <h3>{custom.name}</h3>
        <span className="meta mono">
          FROM {custom.base}
          {params && ` · ${params}`}
        </span>
        {dirty && <span className="tag warn">non sauvegardé</span>}
      </button>

      {open && (
        <div className="custom-body">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            spellCheck="false"
            rows={16}
          />
          <div className="actions">
            <span className="path mono">{custom.prompt_path}</span>
            <button
              className="secondary"
              onClick={() => onSave(prompt)}
              disabled={busy || disabled || !dirty}
            >
              Enregistrer
            </button>
            <button
              className="primary"
              onClick={() => onRebuild(prompt)}
              disabled={busy || disabled}
            >
              {busy ? "Rebuild…" : "Enregistrer & rebuild"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

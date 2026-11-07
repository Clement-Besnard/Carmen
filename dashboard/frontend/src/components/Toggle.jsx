import "./Toggle.css";

/** Interrupteur accessible (role="switch"). `busy` : operation en cours. */
export default function Toggle({ checked, onChange, label, disabled = false, busy = false }) {
  return (
    <button
      type="button"
      role="switch"
      className="toggle"
      aria-checked={checked}
      aria-label={label}
      aria-busy={busy || undefined}
      data-busy={busy || undefined}
      disabled={disabled || busy}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

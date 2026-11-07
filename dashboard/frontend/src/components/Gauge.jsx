import "./Gauge.css";

/** Jauge fine, remplissage plein a l'encre. Valeurs en octets. */
export default function Gauge({ value, max, label, valueText }) {
  const ratio = max ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <div
      className="gauge"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
    >
      <div className="gauge-fill" style={{ width: `${ratio * 100}%` }} />
    </div>
  );
}

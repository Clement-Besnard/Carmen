/**
 * Icone de Carmen : un C qui se remplit comme la jauge VRAM.
 * Meme dessin que public/favicon.svg (a garder synchrones).
 */
export default function Logo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="14" fill="var(--color-accent)" />
      <path
        d="M45.02 21.07A17 17 0 1 0 45.02 42.93"
        fill="none"
        stroke="#fff"
        strokeOpacity=".4"
        strokeWidth="7.5"
        strokeLinecap="round"
      />
      <path
        d="M45.02 21.07A17 17 0 1 0 19.37 43.38"
        fill="none"
        stroke="#fff"
        strokeWidth="7.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

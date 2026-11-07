import "./Skeleton.css";

/** Bloc de remplacement a l'emplacement exact du contenu attendu. */
export default function Skeleton({ width = "100%", height = "0.9em" }) {
  return <span className="skeleton" style={{ width, height }} aria-hidden="true" />;
}

/** N lignes de squelette, au format des lignes de liste d'un panneau. */
export function SkeletonRows({ count = 3, label = "Chargement" }) {
  return (
    <ul className="skeleton-rows" aria-busy="true" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <Skeleton width={`${45 - i * 8}%`} />
          <Skeleton width="18%" />
        </li>
      ))}
    </ul>
  );
}

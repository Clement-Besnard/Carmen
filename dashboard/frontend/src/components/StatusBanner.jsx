import { useStack } from "../lib/stack.jsx";
import { clockTime } from "../lib/format.js";
import Banner from "./Banner.jsx";
import Button from "./Button.jsx";

/**
 * Bandeau global : dit ce qui ne repond pas et comment le verifier,
 * plutot qu'un "Une erreur est survenue".
 */
export default function StatusBanner() {
  const { error, stale, lastSuccess, status, refresh } = useStack();
  if (!error) return null;

  const copy = {
    ollama: {
      title: "Ollama ne répond pas",
      body: (
        <>
          Le backend n'atteint pas <code>{status?.ollama_url ?? "l'API Ollama"}</code>.
          Vérifier avec <code>docker compose ps ollama</code>.
        </>
      ),
    },
    backend: {
      title: "Le dashboard ne répond plus",
      body: (
        <>
          Le navigateur n'atteint pas le serveur FastAPI. Ses journaux :{" "}
          <code>docker compose logs dashboard</code>.
        </>
      ),
    },
    http: {
      title: "L'opération a échoué",
      body: <code className="banner-detail">{error.message}</code>,
    },
  }[error.kind ?? "http"];

  return (
    <Banner
      title={copy.title}
      action={
        <Button size="small" onClick={refresh}>
          Réessayer
        </Button>
      }
    >
      <p>{copy.body}</p>
      {stale && error.kind !== "http" && (
        <p className="banner-meta">
          Les valeurs affichées sont les dernières connues, relevées à{" "}
          {clockTime(lastSuccess)}.
        </p>
      )}
    </Banner>
  );
}

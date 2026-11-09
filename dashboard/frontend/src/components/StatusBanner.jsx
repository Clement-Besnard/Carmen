import { useStack } from "../lib/stack.jsx";
import { clockTime } from "../lib/format.js";
import { useI18n } from "../lib/i18n.jsx";
import Banner from "./Banner.jsx";
import Button from "./Button.jsx";

/**
 * Bandeau global : dit ce qui ne repond pas et comment le verifier,
 * plutot qu'un "Une erreur est survenue".
 */
export default function StatusBanner() {
  const { error, stale, lastSuccess, status, refresh } = useStack();
  const { t } = useI18n();
  if (!error) return null;

  const copy = {
    ollama: {
      title: t("banner.ollama.title"),
      body: t("banner.ollama.body", status?.ollama_url),
    },
    backend: {
      title: t("banner.backend.title"),
      body: t("banner.backend.body"),
    },
    http: {
      title: t("banner.http.title"),
      body: <code className="banner-detail">{error.message}</code>,
    },
  }[error.kind ?? "http"];

  return (
    <Banner
      title={copy.title}
      action={
        <Button size="small" onClick={refresh}>
          {t("common.retry")}
        </Button>
      }
    >
      <p>{copy.body}</p>
      {stale && error.kind !== "http" && (
        <p className="banner-meta">{t("banner.stale", clockTime(lastSuccess))}</p>
      )}
    </Banner>
  );
}

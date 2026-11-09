import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import { useI18n } from "../lib/i18n.jsx";
import { Link, useRouter } from "../lib/router.jsx";

export default function NotFound() {
  const { path } = useRouter();
  const { t } = useI18n();
  return (
    <>
      <PageHeader title={t("notFound.title")} />
      <Panel>
        <p className="panel-empty">
          <strong>{t("notFound.nothing", path)}</strong>
          <Link to="/" className="text-link">
            {t("notFound.back")}
          </Link>
        </p>
      </Panel>
    </>
  );
}

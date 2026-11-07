import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import { Link, useRouter } from "../lib/router.jsx";

export default function NotFound() {
  const { path } = useRouter();
  return (
    <>
      <PageHeader title="Page introuvable" />
      <Panel>
        <p className="panel-empty">
          <strong>
            Rien ne correspond à <code>{path}</code>
          </strong>
          <Link to="/" className="text-link">
            Retour à la vue d'ensemble
          </Link>
        </p>
      </Panel>
    </>
  );
}

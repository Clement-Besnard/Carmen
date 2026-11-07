import { useState } from "react";
import { Notice } from "../components/Banner.jsx";
import ModelTable from "../components/ModelTable.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import { SkeletonRows } from "../components/Skeleton.jsx";
import { useStack } from "../lib/stack.jsx";
import "./pages.css";

export default function Models() {
  const { phase, models } = useStack();
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const visible = needle ? models.filter((m) => m.name.toLowerCase().includes(needle)) : models;

  return (
    <>
      <PageHeader
        title="Modèles"
        actions={
          models.length > 4 && (
            <>
              <label htmlFor="model-filter" className="visually-hidden">
                Filtrer les modèles
              </label>
              <input
                id="model-filter"
                type="search"
                className="search-field"
                placeholder="Filtrer"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </>
          )
        }
      />
      <div className="stack">
        <Notice>Un seul modèle tient en VRAM : en charger un autre décharge le précédent.</Notice>
        <Panel>
          {phase === "loading" && <SkeletonRows count={4} label="Chargement des modèles" />}
          {phase === "unavailable" && (
            <p className="panel-empty">
              <strong>Liste indisponible</strong>
              Ollama ne répond pas, la liste reviendra dès qu'il sera joignable.
            </p>
          )}
          {phase === "ready" && models.length === 0 && (
            <p className="panel-empty">
              <strong>Aucun modèle installé</strong>
              Récupérer un modèle avec <code>docker exec ollama ollama pull qwen3:8b</code>, il
              apparaîtra ici.
            </p>
          )}
          {phase === "ready" && models.length > 0 && visible.length === 0 && (
            <p className="panel-empty">Aucun modèle ne correspond à « {query} ».</p>
          )}
          {phase === "ready" && visible.length > 0 && <ModelTable models={visible} />}
        </Panel>
        <p className="page-footnote">
          Pendant un chargement, les autres modèles sont en pause : un gros modèle peut mettre
          plusieurs secondes à monter depuis le disque.
        </p>
      </div>
    </>
  );
}

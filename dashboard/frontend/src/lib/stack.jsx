/**
 * Etat partage de la stack : modeles, VRAM, version d'Ollama.
 * Interroge /api/models toutes les 3 s (pause quand l'onglet est cache) et
 * centralise les operations longues (load/unload/rebuild) via `runOn`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api } from "./api.js";

const POLL_MS = 3000;

const StackContext = createContext(null);

export function StackProvider({ children }) {
  const [snapshot, setSnapshot] = useState(null); // derniere reponse /api/models valide
  const [status, setStatus] = useState(null); // { version, ollama_url }
  const [error, setError] = useState(null); // ApiError de la derniere tentative
  const [lastSuccess, setLastSuccess] = useState(null);
  // Nom du modele dont une operation longue est en cours.
  const [busy, setBusy] = useState(null);
  // Configuration du backend, dont les services declares. Ne depend pas
  // d'Ollama : sert a decider quelles sections afficher.
  const [config, setConfig] = useState(null);
  const statusRef = useRef(null);
  const configRef = useRef(null);

  const loadConfig = useCallback(() => {
    if (configRef.current) return;
    api
      .config()
      .then((c) => {
        configRef.current = c;
        setConfig(c);
      })
      .catch(() => {});
  }, []);

  const refresh = useCallback(async () => {
    loadConfig();
    try {
      const data = await api.models();
      setSnapshot({
        models: data.models,
        vramUsed: data.vram_used,
        vramTotal: data.vram_total,
      });
      setLastSuccess(new Date());
      setError(null);
      // La version n'est demandee qu'une fois Ollama joignable.
      if (!statusRef.current) {
        api
          .status()
          .then((s) => {
            statusRef.current = s;
            setStatus(s);
          })
          .catch(() => {});
      }
    } catch (err) {
      setError(err);
    }
  }, [loadConfig]);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const runOn = useCallback(
    async (name, action) => {
      setBusy(name);
      setError(null);
      try {
        return await action();
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setBusy(null);
        refresh();
      }
    },
    [refresh]
  );

  // Charge un modele au repos, decharge un modele en VRAM.
  const toggleModel = useCallback(
    (model) =>
      runOn(model.name, () =>
        model.loaded ? api.unload(model.name) : api.load(model.name)
      ).catch(() => {}),
    [runOn]
  );

  const value = useMemo(() => {
    const models = snapshot?.models ?? [];
    return {
      // "loading" : aucune donnee et pas encore d'echec
      // "unavailable" : aucune donnee et la derniere tentative a echoue
      // "ready" : on a des donnees (eventuellement perimees si error != null)
      phase: snapshot ? "ready" : error ? "unavailable" : "loading",
      models,
      loadedModel: models.find((m) => m.loaded) ?? null,
      vramUsed: snapshot?.vramUsed ?? 0,
      vramTotal: snapshot?.vramTotal ?? 0,
      status,
      config,
      // null tant que la config n'est pas lue : on n'affiche rien plutot que
      // de faire apparaitre puis disparaitre la section Services.
      declaredServices: config?.services ?? null,
      // Un fichier de services illisible garde la section visible : sinon
      // l'erreur passerait inapercue (services declares mais rien d'affiche).
      hasServices: Boolean(config?.services?.length || config?.services_error),
      error,
      stale: Boolean(snapshot && error),
      lastSuccess,
      busy,
      refresh,
      runOn,
      toggleModel,
    };
  }, [snapshot, status, config, error, lastSuccess, busy, refresh, runOn, toggleModel]);

  return <StackContext.Provider value={value}>{children}</StackContext.Provider>;
}

export function useStack() {
  return useContext(StackContext);
}

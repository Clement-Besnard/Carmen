import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Appelle `fetcher` au montage puis toutes les `interval` ms (0 = une fois).
 * Garde la derniere donnee valide en cas d'echec : `error` + `data` = perime.
 */
export function usePolling(fetcher, interval = 0) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [checkedAt, setCheckedAt] = useState(null);
  const [pending, setPending] = useState(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    setPending(true);
    try {
      setData(await fetcherRef.current());
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setCheckedAt(new Date());
      setPending(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!interval) return undefined;
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, interval);
    return () => clearInterval(timer);
  }, [refresh, interval]);

  return {
    data,
    error,
    checkedAt,
    pending,
    refresh,
    phase: data ? "ready" : error ? "unavailable" : "loading",
  };
}

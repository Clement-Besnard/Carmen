/**
 * Routeur minimal sur l'History API — evite d'ajouter react-router pour
 * six routes. FastAPI renvoie deja index.html pour tout chemin hors /api.
 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const RouterContext = createContext(null);

// Message de confirmation a afficher avant de quitter la page (brouillon non
// enregistre), ou null. Une seule page a la fois peut bloquer.
let leaveMessage = null;

function normalize(path) {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export function RouterProvider({ children }) {
  const [path, setPath] = useState(() => normalize(window.location.pathname));

  useEffect(() => {
    const onPop = () => setPath(normalize(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((to) => {
    const target = normalize(to);
    if (target === normalize(window.location.pathname)) return;
    if (leaveMessage && !window.confirm(leaveMessage)) return;
    window.history.pushState(null, "", target);
    setPath(target);
    window.scrollTo(0, 0);
  }, []);

  return (
    <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>
  );
}

/** Demande confirmation avant de quitter la page tant que `when` est vrai. */
export function useLeaveGuard(when, message) {
  useEffect(() => {
    if (!when) return undefined;
    leaveMessage = message;
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      leaveMessage = null;
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [when, message]);
}

export function useRouter() {
  return useContext(RouterContext);
}

/**
 * Trouve la premiere route qui correspond. Les segments `:param` sont
 * captures dans `params`.
 */
export function matchRoute(routes, path) {
  const segments = path.split("/").filter(Boolean);
  for (const route of routes) {
    const pattern = route.path.split("/").filter(Boolean);
    if (pattern.length !== segments.length) continue;
    const params = {};
    const ok = pattern.every((part, i) => {
      if (part.startsWith(":")) {
        params[part.slice(1)] = decodeURIComponent(segments[i]);
        return true;
      }
      return part === segments[i];
    });
    if (ok) return { route, params };
  }
  return null;
}

/** Une route est "active" si le chemin courant est elle ou une sous-page. */
export function isActive(current, target) {
  if (target === "/") return current === "/";
  return current === target || current.startsWith(`${target}/`);
}

export function Link({ to, onClick, ...props }) {
  const { navigate } = useRouter();

  function handleClick(event) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    navigate(to);
  }

  return <a href={to} onClick={handleClick} {...props} />;
}

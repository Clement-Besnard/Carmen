import React from "react";
import { createRoot } from "react-dom/client";

// Polices auto-hebergees (sous-ensemble latin) : aucune requete vers un CDN.
import "@fontsource/geist-sans/latin-400.css";
import "@fontsource/geist-sans/latin-500.css";
import "@fontsource/geist-sans/latin-600.css";
import "@fontsource/geist-mono/latin-400.css";
import "@fontsource/geist-mono/latin-500.css";

import "./styles/tokens.css";
import "./styles/base.css";

import App from "./App.jsx";
import { I18nProvider } from "./lib/i18n.jsx";
import { RouterProvider } from "./lib/router.jsx";
import { StackProvider } from "./lib/stack.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <I18nProvider>
      <RouterProvider>
        <StackProvider>
          <App />
        </StackProvider>
      </RouterProvider>
    </I18nProvider>
  </React.StrictMode>
);

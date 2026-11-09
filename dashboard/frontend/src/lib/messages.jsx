/**
 * Textes de l'interface, en francais et en anglais.
 * Une valeur est une chaine, ou une fonction (parametres, pluriels, JSX
 * quand le texte contient du code).
 */

const plural = (n, one, many) => (n > 1 ? many : one);

const fr = {
  // ---------- cadre ----------
  "nav.label": "Navigation principale",
  "nav.overview": "Vue d'ensemble",
  "nav.overview.short": "Accueil",
  "nav.models": "Modèles",
  "nav.models.short": "Modèles",
  "nav.custom": "Modèles custom",
  "nav.custom.short": "Custom",
  "nav.services": "Services",
  "nav.services.short": "Services",
  "nav.settings": "Paramètres",
  "nav.settings.short": "Réglages",
  "skip": "Aller au contenu",
  "lang.label": "Langue de l'interface",
  "lang.title": "Langue",

  // ---------- commun ----------
  "common.retry": "Réessayer",
  "common.newTab": "(nouvel onglet)",
  "common.open": "Ouvrir",
  "common.basedOn": (base) => `basé sur ${base}`,
  "common.loading": "Chargement",
  "common.unknown": "inconnue",

  // ---------- bandeau d'erreur ----------
  "banner.ollama.title": "Ollama ne répond pas",
  "banner.ollama.body": (url) => (
    <>
      Le backend n'atteint pas <code>{url ?? "l'API Ollama"}</code>. Vérifier avec{" "}
      <code>docker compose ps ollama</code>.
    </>
  ),
  "banner.backend.title": "Le dashboard ne répond plus",
  "banner.backend.body": () => (
    <>
      Le navigateur n'atteint pas le serveur FastAPI. Ses journaux :{" "}
      <code>docker compose logs dashboard</code>.
    </>
  ),
  "banner.http.title": "L'opération a échoué",
  "banner.stale": (time) =>
    `Les valeurs affichées sont les dernières connues, relevées à ${time}.`,

  // ---------- GPU ----------
  "gpu.vramUsed": "VRAM utilisée",
  "gpu.valueText": (used, total, unit) => `${used} ${unit} sur ${total} ${unit}`,
  "gpu.unavailable": "État du GPU inconnu tant qu'Ollama ne répond pas.",
  "gpu.unload": "Décharger",
  "gpu.unloading": "Déchargement…",
  "gpu.idle": "Aucun modèle en VRAM, le GPU est au repos.",
  "gpu.pick": "Choisir un modèle",

  // ---------- liste des modeles ----------
  "table.name": "Nom",
  "table.size": "Taille",
  "table.quant": "Quantif.",
  "table.disk": "Disque",
  "table.vram": "VRAM",
  "table.loading": "Chargement…",
  "table.loadingReplaces": (name) => `Chargement… remplace ${name}`,
  "table.unloading": "Déchargement…",
  "table.sharedWith": (base) => `Poids partagés avec ${base}`,
  "table.load": (name) => `Charger ${name}`,
  "table.unload": (name) => `Décharger ${name}`,

  // ---------- vue d'ensemble ----------
  "overview.title": "Vue d'ensemble",
  "overview.modelsMeta": (n, size, unit) =>
    `${n} ${plural(n, "modèle", "modèles")} · ${size} ${unit} sur disque`,
  "overview.seeAll": "Tout voir",
  "overview.modelsUnavailable": "Liste indisponible tant qu'Ollama ne répond pas.",
  "overview.loadingModels": "Chargement des modèles",
  "overview.noModels": "Aucun modèle installé",
  "overview.noModelsBody": () => (
    <>
      Récupérer un modèle avec <code>docker exec ollama ollama pull qwen3:8b</code>.
    </>
  ),
  "overview.servicesMeta": (up, total) => `${up} sur ${total}`,
  "overview.details": "Détails",
  "overview.checkingServices": "Vérification des services",
  "overview.servicesUnavailable": "Impossible de vérifier les services.",

  // ---------- page Modeles ----------
  "models.title": "Modèles",
  "models.filterLabel": "Filtrer les modèles",
  "models.filter": "Filtrer",
  "models.notice": "Un seul modèle tient en VRAM : en charger un autre décharge le précédent.",
  "models.unavailable": "Liste indisponible",
  "models.unavailableBody": "Ollama ne répond pas, la liste reviendra dès qu'il sera joignable.",
  "models.none": "Aucun modèle installé",
  "models.noneBody": () => (
    <>
      Récupérer un modèle avec <code>docker exec ollama ollama pull qwen3:8b</code>, il
      apparaîtra ici.
    </>
  ),
  "models.noMatch": (query) => `Aucun modèle ne correspond à « ${query} ».`,
  "models.footnote":
    "Pendant un chargement, les autres modèles sont en pause : un gros modèle peut mettre plusieurs secondes à monter depuis le disque.",

  // ---------- modeles custom ----------
  "custom.title": "Modèles custom",
  "custom.crumb": "Modèles custom /",
  "custom.leave": "Le prompt a des modifications non enregistrées. Quitter quand même ?",
  "custom.list": "Modèles",
  "custom.modelfile": "Modelfile",
  "custom.base": "Base",
  "custom.prompt": "Prompt système",
  "custom.promptLabel": (name) => `Prompt système de ${name}`,
  "custom.rebuilding": "Rebuild en cours… le modèle est recréé dans Ollama.",
  "custom.saving": "Enregistrement…",
  "custom.dirty": "Modifié, non enregistré",
  "custom.upToDate": "À jour",
  "custom.saved": "Enregistré",
  "custom.rebuilt": "Rebuild terminé",
  "custom.rebuiltReloaded": "Rebuild terminé, modèle rechargé en VRAM",
  "custom.resultAt": (text, time) => `${text} à ${time}`,
  "custom.chars": (n) => `${n} ${plural(n, "caractère", "caractères")}`,
  "custom.save": "Enregistrer",
  "custom.rebuild": "Rebuild",
  "custom.rebuildBusy": "Rebuild…",
  "custom.saveAndRebuild": "Enregistrer et rebuild",
  "custom.readFailedMeta": "Lecture impossible",
  "custom.readFailed": "Les modèles custom n'ont pas pu être lus",
  "custom.readingMeta": "Lecture des Modelfiles…",
  "custom.loading": "Chargement des modèles custom",
  "custom.none": "Aucun modèle custom",
  "custom.noneBody": () => (
    <>
      Un modèle custom, c'est un prompt dans <code>prompts/&lt;nom&gt;.md</code> et un{" "}
      <code>modelfiles/&lt;nom&gt;.Modelfile</code>. Créer les deux, puis revenir ici pour
      l'éditer et le reconstruire.
    </>
  ),
  "custom.notFound": (name) => `Aucun modèle custom ne s'appelle « ${name} ».`,

  // ---------- services ----------
  "services.title": "Services",
  "services.unreachable": "injoignable",
  "services.diagContainer": (container) => (
    <>
      Pas de réponse. Vérifier avec <code>docker logs {container}</code>
    </>
  ),
  "services.diagUrl": (url) => (
    <>
      Pas de réponse sur <code>{url}</code> depuis le dashboard.
    </>
  ),
  "services.badFileMeta": "Fichier de services illisible",
  "services.noneMeta": "Aucun service déclaré",
  "services.badFile": "Le fichier des services n'a pas pu être lu",
  "services.none": "Carmen ne surveille aucun service",
  "services.noneBody": (file) => (
    <>
      Pour suivre une application qui utilise Ollama, la déclarer dans <code>{file}</code>.
      Sans ce fichier, cette section reste masquée.
    </>
  ),
  "services.exampleDescription": "Interface de chat",
  "services.fields": () => (
    <>
      <code>url</code> est testée par le dashboard. <code>link</code> (lien « Ouvrir ») et{" "}
      <code>container</code> (diagnostic) sont facultatifs.
    </>
  ),
  "services.meta": (up, total, time) =>
    `${up} sur ${total} ${plural(up, "répond", "répondent")} · vérifié à ${time}`,
  "services.checkingMeta": "Vérification en cours…",
  "services.checkFailedMeta": "Vérification impossible",
  "services.checking": "Vérification…",
  "services.recheck": "Revérifier",
  "services.checkLabel": "Vérification des services",
  "services.checkFailed": "Le dashboard n'a pas pu vérifier les services",
  "services.footnote": (seconds) =>
    `Un service « répond » dès qu'il renvoie une réponse HTTP au dashboard. Vérification toutes les ${seconds} s.`,
  "services.readingConfig": "Lecture de la configuration…",

  // ---------- parametres ----------
  "settings.title": "Paramètres",
  "settings.meta": "Lecture seule. Ces valeurs viennent de l'environnement du conteneur.",
  "settings.help.ollama": "Adresse de l'API Ollama vue par le backend.",
  "settings.help.stack": "Dossier où sont lus prompts/ et modelfiles/.",
  "settings.help.vram": "Total affiché dans la jauge VRAM, le conteneur ne peut pas le lire sur le GPU.",
  "settings.help.servicesError": (error) => `Illisible : ${error}`,
  "settings.help.servicesDeclared": (n, names) =>
    `${n} ${plural(n, "service déclaré", "services déclarés")} : ${names}.`,
  "settings.help.servicesNone": "Aucun service déclaré : la section Services est masquée.",
  "settings.copy": "Copier",
  "settings.copied": "Copié",
  "settings.copyFailed": "Échec",
  "settings.copyLabel": (key) => `Copier ${key}`,
  "settings.unreadable": "Configuration illisible",
  "settings.reading": "Lecture de la configuration",

  // ---------- page introuvable ----------
  "notFound.title": "Page introuvable",
  "notFound.nothing": (path) => (
    <>
      Rien ne correspond à <code>{path}</code>
    </>
  ),
  "notFound.back": "Retour à la vue d'ensemble",
};

const en = {
  // ---------- frame ----------
  "nav.label": "Main navigation",
  "nav.overview": "Overview",
  "nav.overview.short": "Home",
  "nav.models": "Models",
  "nav.models.short": "Models",
  "nav.custom": "Custom models",
  "nav.custom.short": "Custom",
  "nav.services": "Services",
  "nav.services.short": "Services",
  "nav.settings": "Settings",
  "nav.settings.short": "Settings",
  "skip": "Skip to content",
  "lang.label": "Interface language",
  "lang.title": "Language",

  // ---------- common ----------
  "common.retry": "Retry",
  "common.newTab": "(new tab)",
  "common.open": "Open",
  "common.basedOn": (base) => `based on ${base}`,
  "common.loading": "Loading",
  "common.unknown": "unknown",

  // ---------- error banner ----------
  "banner.ollama.title": "Ollama isn't responding",
  "banner.ollama.body": (url) => (
    <>
      The backend can't reach <code>{url ?? "the Ollama API"}</code>. Check it with{" "}
      <code>docker compose ps ollama</code>.
    </>
  ),
  "banner.backend.title": "The dashboard isn't responding",
  "banner.backend.body": () => (
    <>
      The browser can't reach the FastAPI server. Its logs:{" "}
      <code>docker compose logs dashboard</code>.
    </>
  ),
  "banner.http.title": "The operation failed",
  "banner.stale": (time) => `The values shown are the last known ones, read at ${time}.`,

  // ---------- GPU ----------
  "gpu.vramUsed": "VRAM used",
  "gpu.valueText": (used, total, unit) => `${used} ${unit} of ${total} ${unit}`,
  "gpu.unavailable": "GPU state unknown while Ollama isn't responding.",
  "gpu.unload": "Unload",
  "gpu.unloading": "Unloading…",
  "gpu.idle": "No model in VRAM, the GPU is idle.",
  "gpu.pick": "Pick a model",

  // ---------- model list ----------
  "table.name": "Name",
  "table.size": "Size",
  "table.quant": "Quant.",
  "table.disk": "Disk",
  "table.vram": "VRAM",
  "table.loading": "Loading…",
  "table.loadingReplaces": (name) => `Loading… replaces ${name}`,
  "table.unloading": "Unloading…",
  "table.sharedWith": (base) => `Weights shared with ${base}`,
  "table.load": (name) => `Load ${name}`,
  "table.unload": (name) => `Unload ${name}`,

  // ---------- overview ----------
  "overview.title": "Overview",
  "overview.modelsMeta": (n, size, unit) =>
    `${n} ${plural(n, "model", "models")} · ${size} ${unit} on disk`,
  "overview.seeAll": "See all",
  "overview.modelsUnavailable": "List unavailable while Ollama isn't responding.",
  "overview.loadingModels": "Loading models",
  "overview.noModels": "No model installed",
  "overview.noModelsBody": () => (
    <>
      Pull a model with <code>docker exec ollama ollama pull qwen3:8b</code>.
    </>
  ),
  "overview.servicesMeta": (up, total) => `${up} of ${total}`,
  "overview.details": "Details",
  "overview.checkingServices": "Checking services",
  "overview.servicesUnavailable": "Couldn't check the services.",

  // ---------- models page ----------
  "models.title": "Models",
  "models.filterLabel": "Filter models",
  "models.filter": "Filter",
  "models.notice": "Only one model fits in VRAM: loading another one unloads the previous one.",
  "models.unavailable": "List unavailable",
  "models.unavailableBody": "Ollama isn't responding. The list will come back as soon as it's reachable.",
  "models.none": "No model installed",
  "models.noneBody": () => (
    <>
      Pull a model with <code>docker exec ollama ollama pull qwen3:8b</code> and it'll show up
      here.
    </>
  ),
  "models.noMatch": (query) => `No model matches "${query}".`,
  "models.footnote":
    "While a model loads, the others are paused: a large model can take several seconds to load from disk.",

  // ---------- custom models ----------
  "custom.title": "Custom models",
  "custom.crumb": "Custom models /",
  "custom.leave": "The prompt has unsaved changes. Leave anyway?",
  "custom.list": "Models",
  "custom.modelfile": "Modelfile",
  "custom.base": "Base",
  "custom.prompt": "System prompt",
  "custom.promptLabel": (name) => `System prompt of ${name}`,
  "custom.rebuilding": "Rebuilding… the model is being recreated in Ollama.",
  "custom.saving": "Saving…",
  "custom.dirty": "Modified, not saved",
  "custom.upToDate": "Up to date",
  "custom.saved": "Saved",
  "custom.rebuilt": "Rebuild done",
  "custom.rebuiltReloaded": "Rebuild done, model reloaded in VRAM",
  "custom.resultAt": (text, time) => `${text} at ${time}`,
  "custom.chars": (n) => `${n} ${plural(n, "character", "characters")}`,
  "custom.save": "Save",
  "custom.rebuild": "Rebuild",
  "custom.rebuildBusy": "Rebuilding…",
  "custom.saveAndRebuild": "Save and rebuild",
  "custom.readFailedMeta": "Couldn't read",
  "custom.readFailed": "Couldn't read the custom models",
  "custom.readingMeta": "Reading Modelfiles…",
  "custom.loading": "Loading custom models",
  "custom.none": "No custom model",
  "custom.noneBody": () => (
    <>
      A custom model is a prompt in <code>prompts/&lt;name&gt;.md</code> plus a{" "}
      <code>modelfiles/&lt;name&gt;.Modelfile</code>. Create both, then come back here to edit
      and rebuild it.
    </>
  ),
  "custom.notFound": (name) => `No custom model is called "${name}".`,

  // ---------- services ----------
  "services.title": "Services",
  "services.unreachable": "unreachable",
  "services.diagContainer": (container) => (
    <>
      No response. Check it with <code>docker logs {container}</code>
    </>
  ),
  "services.diagUrl": (url) => (
    <>
      No response on <code>{url}</code> from the dashboard.
    </>
  ),
  "services.badFileMeta": "Unreadable services file",
  "services.noneMeta": "No service declared",
  "services.badFile": "Couldn't read the services file",
  "services.none": "Carmen isn't monitoring any service",
  "services.noneBody": (file) => (
    <>
      To monitor an app that uses Ollama, declare it in <code>{file}</code>. Without that file,
      this section stays hidden.
    </>
  ),
  "services.exampleDescription": "Chat interface",
  "services.fields": () => (
    <>
      The dashboard checks <code>url</code>. <code>link</code> (the "Open" link) and{" "}
      <code>container</code> (diagnostics) are optional.
    </>
  ),
  "services.meta": (up, total, time) => `${up} of ${total} responding · checked at ${time}`,
  "services.checkingMeta": "Checking…",
  "services.checkFailedMeta": "Check failed",
  "services.checking": "Checking…",
  "services.recheck": "Check again",
  "services.checkLabel": "Checking services",
  "services.checkFailed": "The dashboard couldn't check the services",
  "services.footnote": (seconds) =>
    `A service is "responding" as soon as it sends an HTTP response to the dashboard. Checked every ${seconds} s.`,
  "services.readingConfig": "Reading configuration…",

  // ---------- settings ----------
  "settings.title": "Settings",
  "settings.meta": "Read-only. These values come from the container's environment.",
  "settings.help.ollama": "Address of the Ollama API, as seen by the backend.",
  "settings.help.stack": "Folder where prompts/ and modelfiles/ are read.",
  "settings.help.vram": "Total shown in the VRAM gauge; the container can't read it from the GPU.",
  "settings.help.servicesError": (error) => `Unreadable: ${error}`,
  "settings.help.servicesDeclared": (n, names) =>
    `${n} ${plural(n, "service declared", "services declared")}: ${names}.`,
  "settings.help.servicesNone": "No service declared: the Services section is hidden.",
  "settings.copy": "Copy",
  "settings.copied": "Copied",
  "settings.copyFailed": "Failed",
  "settings.copyLabel": (key) => `Copy ${key}`,
  "settings.unreadable": "Unreadable configuration",
  "settings.reading": "Reading configuration",

  // ---------- not found ----------
  "notFound.title": "Page not found",
  "notFound.nothing": (path) => (
    <>
      Nothing matches <code>{path}</code>
    </>
  ),
  "notFound.back": "Back to overview",
};

export const MESSAGES = { fr, en };

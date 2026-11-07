import Shell from "./components/Shell.jsx";
import { matchRoute, useRouter } from "./lib/router.jsx";
import Custom from "./pages/Custom.jsx";
import Models from "./pages/Models.jsx";
import NotFound from "./pages/NotFound.jsx";
import Overview from "./pages/Overview.jsx";
import Services from "./pages/Services.jsx";
import Settings from "./pages/Settings.jsx";

const ROUTES = [
  { path: "/", render: () => <Overview /> },
  { path: "/modeles", render: () => <Models /> },
  { path: "/custom", render: () => <Custom /> },
  { path: "/custom/:name", render: ({ name }) => <Custom name={name} /> },
  { path: "/services", render: () => <Services /> },
  { path: "/parametres", render: () => <Settings /> },
];

export default function App() {
  const { path } = useRouter();
  const match = matchRoute(ROUTES, path);
  return <Shell>{match ? match.route.render(match.params) : <NotFound />}</Shell>;
}

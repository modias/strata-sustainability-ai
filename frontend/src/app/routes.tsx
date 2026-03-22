import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Home } from "./components/Home";
import { FeaturedCompanies } from "./pages/FeaturedCompanies";
import { CorporateHubs } from "./pages/CorporateHubs";
import { AnalysisView } from "./components/AnalysisView";
import { About } from "./pages/About";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
      { path: "companies", Component: FeaturedCompanies },
      { path: "corporate-hubs", Component: CorporateHubs },
      { path: "analysis/:mode/:entityId", Component: AnalysisView },
    ],
  },
]);

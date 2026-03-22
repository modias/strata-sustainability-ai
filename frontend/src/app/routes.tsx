import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Home } from "./components/Home";
import { FeaturedCompanies } from "./components/FeaturedCompanies";
import { CorporateHubs } from "./components/CorporateHubs";
import { AnalysisView } from "./components/AnalysisView";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "companies", Component: FeaturedCompanies },
      { path: "corporate-hubs", Component: CorporateHubs },
      { path: "analysis/:mode/:entityId", Component: AnalysisView },
    ],
  },
]);

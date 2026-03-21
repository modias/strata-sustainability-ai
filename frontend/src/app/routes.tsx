import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Home } from "./components/Home";
import { AnalysisView } from "./components/AnalysisView";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "analysis/:mode/:entityId", Component: AnalysisView },
    ],
  },
]);

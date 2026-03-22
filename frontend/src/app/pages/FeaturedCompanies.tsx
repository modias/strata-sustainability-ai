import { useNavigate } from "react-router-dom";
import { StrataEntityListPage } from "../components/StrataEntityListPage";

const FEATURED_IDS = ["amazon", "apple", "google", "nvidia", "samsung", "tesla"] as const;

const COMPANY_DESCRIPTIONS: Record<string, string> = {
  tesla: "EV manufacturer, Gigafactory energy, Scope 3 supply chain",
  amazon: "Climate Pledge 2040, AWS renewable energy, logistics emissions",
  microsoft: "Carbon negative by 2030, AI energy demand rising",
  apple: "Supply chain net-zero, recycled materials program",
  google: "24/7 carbon-free energy target, AI compute footprint",
  nvidia: "GPU energy intensity, no SBTi target filed",
  samsung: "RE100 by 2050, semiconductor manufacturing intensity",
};

export function FeaturedCompanies() {
  const navigate = useNavigate();
  return (
    <StrataEntityListPage
      title="Featured Companies"
      entityIds={FEATURED_IDS}
      itemHref={(e) => `/analysis/corporate/${e.id}`}
      descriptions={COMPANY_DESCRIPTIONS}
      defaultDescription="Corporate sustainability analysis"
      variant="corporate"
      topContent={
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors bg-transparent border-none cursor-pointer p-0"
        >
          ← Back
        </button>
      }
    />
  );
}

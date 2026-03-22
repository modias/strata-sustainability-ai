import { useNavigate } from "react-router-dom";
import { StrataEntityListPage } from "../components/StrataEntityListPage";

const HUB_IDS = [
  "hub-austin-tx",
  "hub-boston-ma",
  "hub-new-york-ny",
  "hub-san-francisco-ca",
  "hub-seattle-wa",
  "hub-washington-dc",
] as const;

const HUB_DESCRIPTIONS: Record<string, string> = {
  "hub-austin-tx": "Tech growth hub, extreme heat vulnerability, water stress",
  "hub-boston-ma": "Climate resilient, innovation economy, green investment",
  "hub-new-york-ny": "Dense urban heat island, coastal flood risk, equity gaps",
  "hub-san-francisco-ca": "Green leader, housing crisis, displacement pressure",
  "hub-seattle-wa": "Renewable energy, tech emissions, affordability declining",
  "hub-washington-dc": "Federal green mandates, equity in investment zones",
};

export function CorporateHubs() {
  const navigate = useNavigate();
  return (
    <StrataEntityListPage
      title="Corporate Hubs"
      entityIds={HUB_IDS}
      itemHref={(e) => `/analysis/hub/${e.id}`}
      descriptions={HUB_DESCRIPTIONS}
      variant="hubs"
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

import { StrataEntityListPage } from "./StrataEntityListPage";

const HUB_IDS = [
  "hub-austin-tx",
  "hub-boston-ma",
  "hub-new-york-ny",
  "hub-san-francisco-ca",
  "hub-seattle-wa",
  "hub-washington-dc",
] as const;

export function CorporateHubs() {
  return (
    <StrataEntityListPage
      title="Corporate Hubs"
      entityIds={HUB_IDS}
      itemHref={(e) => `/analysis/neighborhood/${e.id}`}
      actionLabel="View Hub →"
      variant="hubs"
    />
  );
}

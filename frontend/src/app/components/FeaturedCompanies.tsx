import { StrataEntityListPage } from "./StrataEntityListPage";

const FEATURED_IDS = ["amazon", "apple", "google", "nvidia", "samsung", "tesla"] as const;

export function FeaturedCompanies() {
  return (
    <StrataEntityListPage
      title="Featured Companies"
      entityIds={FEATURED_IDS}
      itemHref={(e) => `/analysis/corporate/${e.id}`}
      actionLabel="Analyze →"
    />
  );
}

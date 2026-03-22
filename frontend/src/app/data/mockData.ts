export type Mode = "neighborhood" | "corporate";

export type Verdict = "IMPROVING" | "STAGNANT" | "DECLINING" | "CONTESTED";

export type DissentLevel = "LOW" | "MODERATE" | "HIGH";

export interface Entity {
  id: string;
  name: string;
  mode: Mode;
  location?: { lat: number; lng: number };
  address?: string;
  /** CV / demo pipeline metrics (0–1 for green coverage) */
  greenSpaceRatio?: number;
  heatIntensityScore?: number;
  airQualityPm25?: number;
}

export interface AgentOutput {
  agentName: string;
  score: number;
  confidence: number;
  keyFindings: string[];
  dataSource: string;
  reasoning: string;
  stance?: string;
  claim?: string;
  risks?: string[];
  modelUsed?: string;
  groundingSources?: string[];
}

export interface DevilsAdvocateChallenge {
  targetAgent: string;
  challenge: string;
  counterDataSource: string;
  specificDataPoint: string;
}

export interface AnalysisResult {
  entity: Entity;
  verdict: Verdict;
  dissentLevel: DissentLevel;
  dissentScore: number;
  agents: AgentOutput[];
  devilsAdvocate: DevilsAdvocateChallenge;
  radarData: {
    dimension: string;
    score: number;
    fullMark: 100;
  }[];
  suggestedQuestions: string[];
  noExpansionActions?: {
    action: string;
    timeframe: string;
    carbonImpact: string;
    cost: string;
  }[];
}

// Pre-cached entities
export const ENTITIES: Entity[] = [
  {
    id: "anacostia-dc",
    name: "Anacostia, Washington DC",
    mode: "neighborhood",
    location: { lat: 38.863, lng: -76.9823 },
    address: "1901 Mississippi Ave SE, Washington, DC 20020",
    greenSpaceRatio: 0.18,
    heatIntensityScore: 72,
    airQualityPm25: 12.4,
  },
  {
    id: "greenpoint-brooklyn",
    name: "Greenpoint, Brooklyn NY",
    mode: "neighborhood",
    location: { lat: 40.7297, lng: -73.9504 },
    address: "250 McGuinness Blvd, Brooklyn, NY 11222",
    greenSpaceRatio: 0.21,
    heatIntensityScore: 54,
    airQualityPm25: 13.1,
  },
  {
    id: "patagonia",
    name: "Patagonia Inc.",
    mode: "corporate",
    greenSpaceRatio: 0.24,
    heatIntensityScore: 42,
    airQualityPm25: 8.5,
  },
  {
    id: "tesla",
    name: "Tesla Inc.",
    mode: "corporate",
    location: { lat: 30.2272, lng: -97.798 },
    greenSpaceRatio: 0.18,
    heatIntensityScore: 65,
    airQualityPm25: 14.2,
  },
  {
    id: "east-austin",
    name: "East Austin, TX",
    mode: "neighborhood",
    location: { lat: 30.2672, lng: -97.7179 },
    address: "1100 E 11th St, Austin, TX 78702",
    greenSpaceRatio: 0.12,
    heatIntensityScore: 88,
    airQualityPm25: 11.5,
  },
  {
    id: "amazon",
    name: "Amazon.com Inc.",
    mode: "corporate",
    location: { lat: 47.6062, lng: -122.3321 },
    greenSpaceRatio: 0.22,
    heatIntensityScore: 58,
    airQualityPm25: 9.8,
  },
  {
    id: "microsoft",
    name: "Microsoft Corporation",
    mode: "corporate",
    location: { lat: 47.6423, lng: -122.1391 },
    greenSpaceRatio: 0.24,
    heatIntensityScore: 45,
    airQualityPm25: 8.1,
  },
  {
    id: "mission-district-sf",
    name: "Mission District, San Francisco",
    mode: "neighborhood",
    location: { lat: 37.7599, lng: -122.4148 },
    address: "2800 Mission St, San Francisco, CA 94110",
    greenSpaceRatio: 0.19,
    heatIntensityScore: 31,
    airQualityPm25: 9.6,
  },
  {
    id: "unilever",
    name: "Unilever PLC",
    mode: "corporate",
    greenSpaceRatio: 0.2,
    heatIntensityScore: 52,
    airQualityPm25: 10.5,
  },
  {
    id: "apple",
    name: "Apple Inc.",
    mode: "corporate",
    location: { lat: 37.3346, lng: -122.009 },
    greenSpaceRatio: 0.31,
    heatIntensityScore: 38,
    airQualityPm25: 7.4,
  },
  {
    id: "google",
    name: "Google LLC",
    mode: "corporate",
    location: { lat: 37.422, lng: -122.0841 },
    greenSpaceRatio: 0.28,
    heatIntensityScore: 41,
    airQualityPm25: 8.8,
  },
  {
    id: "nvidia",
    name: "Nvidia Corporation",
    mode: "corporate",
    location: { lat: 37.3688, lng: -122.0363 },
    greenSpaceRatio: 0.18,
    heatIntensityScore: 62,
    airQualityPm25: 11.2,
  },
  {
    id: "samsung",
    name: "Samsung Electronics Co., Ltd.",
    mode: "corporate",
    location: { lat: 37.5665, lng: 126.978 },
    greenSpaceRatio: 0.15,
    heatIntensityScore: 71,
    airQualityPm25: 18.4,
  },
  {
    id: "hub-austin-tx",
    name: "Austin, TX",
    mode: "neighborhood",
    location: { lat: 30.2672, lng: -97.7431 },
    address: "Austin, TX metro area",
    greenSpaceRatio: 0.23,
    heatIntensityScore: 74,
    airQualityPm25: 10.2,
  },
  {
    id: "hub-boston-ma",
    name: "Boston, MA",
    mode: "neighborhood",
    location: { lat: 42.3601, lng: -71.0589 },
    address: "Boston, MA metro area",
    greenSpaceRatio: 0.28,
    heatIntensityScore: 48,
    airQualityPm25: 9.5,
  },
  {
    id: "hub-new-york-ny",
    name: "New York City, NY",
    mode: "neighborhood",
    location: { lat: 40.7128, lng: -74.006 },
    address: "New York City, NY metro area",
    greenSpaceRatio: 0.16,
    heatIntensityScore: 52,
    airQualityPm25: 15.0,
  },
  {
    id: "hub-san-francisco-ca",
    name: "San Francisco Bay, CA",
    mode: "neighborhood",
    location: { lat: 37.7749, lng: -122.4194 },
    address: "San Francisco Bay Area, CA",
    greenSpaceRatio: 0.22,
    heatIntensityScore: 46,
    airQualityPm25: 11.5,
  },
  {
    id: "hub-seattle-wa",
    name: "Seattle, WA",
    mode: "neighborhood",
    location: { lat: 47.6062, lng: -122.3321 },
    address: "Seattle, WA metro area",
    greenSpaceRatio: 0.3,
    heatIntensityScore: 50,
    airQualityPm25: 8.5,
  },
  {
    id: "hub-washington-dc",
    name: "Washington, DC",
    mode: "neighborhood",
    location: { lat: 38.9072, lng: -77.0369 },
    address: "Washington, DC metro area",
    greenSpaceRatio: 0.34,
    heatIntensityScore: 61,
    airQualityPm25: 11.8,
  },
  {
    id: "phoenix-south",
    name: "Phoenix South",
    mode: "neighborhood",
    location: { lat: 33.3528, lng: -112.074 },
    address: "Phoenix, AZ",
    greenSpaceRatio: 0.06,
    heatIntensityScore: 89,
    airQualityPm25: 18.8,
  },
  {
    id: "detroit-midtown",
    name: "Detroit Midtown",
    mode: "neighborhood",
    location: { lat: 42.3462, lng: -83.0648 },
    address: "Detroit, MI",
    greenSpaceRatio: 0.32,
    heatIntensityScore: 38,
    airQualityPm25: 9.2,
  },
];

/**
 * Route `entityId` → Snowflake `entity_id` for `/analyze` and `/history`.
 * Only include entries where the value exists in `verdicts` (distinct check in Snowflake).
 * Currently `verdicts` has: `anacostia_test` — other routes use their route id as `entity_id`.
 */
export const SNOWFLAKE_ENTITY_ID: Partial<Record<string, string>> = {
  "anacostia-dc": "anacostia_test",
};

// Mock analysis results
export const MOCK_RESULTS: Record<string, AnalysisResult> = {
  "anacostia-dc": {
    entity: ENTITIES[0],
    verdict: "CONTESTED",
    dissentLevel: "HIGH",
    dissentScore: 0.73,
    agents: [
      {
        agentName: "Climate resilience",
        score: 72,
        confidence: 0.84,
        keyFindings: [
          "Green coverage increased 18% since 2021 (satellite vegetation analysis)",
          "Urban heat island intensity decreased by 2.3°C in summer months",
          "Tree canopy maturity index improving: 34% of new plantings 3+ years old",
        ],
        dataSource: "Satellite imagery, national weather records, and image analysis",
        reasoning: "The $47M green infrastructure investment is producing measurable environmental results. Vegetation trends show sustained green cover growth, thermal analysis confirms localized cooling, and satellite comparison over time reveals reduced paved surface share. The trajectory is environmentally positive.",
      },
      {
        agentName: "Public health",
        score: 68,
        confidence: 0.76,
        keyFindings: [
          "PM2.5 air quality improved 12% year-over-year (regional monitors)",
          "Walkability index increased to 67/100 (EPA EnviroAtlas)",
          "Street-level shade coverage: 42% (street photos and automated review)",
        ],
        dataSource: "Air-quality sensors, EPA community data, street-level imagery",
        reasoning: "Street-level livability metrics show genuine improvement. Air quality stations show consistent PM2.5 decline, transit data indicates three new bike-share stations within 0.5mi, and street imagery review confirms pedestrian-level shade canopy deployment. Public health trajectory is improving.",
      },
      {
        agentName: "Urban development",
        score: 58,
        confidence: 0.71,
        keyFindings: [
          "Building permits up 340% (2021-2024) - primarily market-rate housing",
          "New construction: 87% residential, 13% mixed-use retail",
          "Infrastructure investment concentrated along commercial corridors",
        ],
        dataSource: "DC building permits and satellite-based change detection",
        reasoning: "Development pattern shows rapid densification with limited affordable housing integration. Permit data reveals high-density residential construction without corresponding community facility expansion. The development is market-driven rather than community-driven, creating displacement risk.",
      },
      {
        agentName: "Equity & housing",
        score: 34,
        confidence: 0.89,
        keyFindings: [
          "Median rent increased 34% (2021-2024) - Census ACS",
          "Median household income: $42,300 - below DC average of $93,500",
          "Rent burden: 48% of residents pay >30% income on housing (up from 39%)",
        ],
        dataSource: "Census ACS 2022, DC Office of Revenue Analysis",
        reasoning: "Every environmental improvement metric correlates with accelerating displacement. The sustainability investment is pricing out existing residents. A household earning the neighborhood median cannot afford the current median rent of $1,690/mo without severe housing cost burden. This is textbook green gentrification.",
      },
    ],
    devilsAdvocate: {
      targetAgent: "Climate resilience",
      challenge: "Your 18% green coverage increase is accurate but incomplete. WRI Aqueduct data shows water stress in the Anacostia watershed increased from 'medium-low' to 'medium-high' between 2020-2024. You're measuring tree planting without accounting for whether the urban forest is hydrologically sustainable. A 2.3°C heat reduction is real, but if the water infrastructure can't support the vegetation at scale, your improvement is temporary.",
      counterDataSource: "WRI Aqueduct, DC Water Long Range Plan 2024",
      specificDataPoint: "Anacostia River basin water stress index: 2.8 → 3.4 (2020-2024)",
    },
    radarData: [
      { dimension: "Climate Resilience", score: 72, fullMark: 100 },
      { dimension: "Public Health", score: 68, fullMark: 100 },
      { dimension: "Development Quality", score: 58, fullMark: 100 },
      { dimension: "Equity & Access", score: 34, fullMark: 100 },
      { dimension: "Overall Trajectory", score: 58, fullMark: 100 },
    ],
    suggestedQuestions: [
      "Who benefits from the green investment happening here?",
      "What would it take to move this verdict to IMPROVING?",
      "Which census tracts have the highest displacement risk?",
    ],
  },
  "patagonia": {
    entity: ENTITIES[2],
    verdict: "IMPROVING",
    dissentLevel: "LOW",
    dissentScore: 0.21,
    agents: [
      {
        agentName: "Energy systems",
        score: 88,
        confidence: 0.92,
        keyFindings: [
          "100% renewable electricity across all owned facilities (CDP disclosure)",
          "Energy intensity: 2.4 kWh/$1000 revenue - 34% below apparel sector median",
          "On-site solar: 12MW installed, targeting 25MW by 2027",
        ],
        dataSource: "CDP Open Data, EPA ENERGY STAR benchmarks",
        reasoning: "Patagonia's energy performance significantly exceeds sector standards. Renewable electricity procurement is verified via renewable energy certificates, energy intensity trajectory shows sustained improvement, and capital allocation toward on-site generation reduces grid dependency. Energy systems are industry-leading.",
      },
      {
        agentName: "Carbon accounting",
        score: 76,
        confidence: 0.85,
        keyFindings: [
          "Scope 1+2 emissions: 12,400 tCO2e (2023), down 41% since 2019",
          "Scope 3: 87% of total footprint - primarily raw materials and manufacturing",
          "SBTi-validated 1.5°C pathway commitment with interim targets",
        ],
        dataSource: "CDP, SBTi registry, SEC 10-K climate disclosure",
        reasoning: "Direct emissions control is strong with verified reduction trajectory. Scope 3 dominance is expected in apparel manufacturing. SBTi validation confirms science-based targets, but supplier engagement depth requires verification—74% of tier-1 suppliers report emissions, which is above sector average but not comprehensive.",
      },
      {
        agentName: "Operations",
        score: 82,
        confidence: 0.79,
        keyFindings: [
          "Material circularity: 72% of products use recycled or regenerative materials",
          "Worn Wear repair program: 127,000 items repaired in 2023",
          "Water intensity: 18 gal/$1000 revenue - 56% below sector median",
        ],
        dataSource: "Patagonia Footprint Chronicles, EPA sector benchmarks",
        reasoning: "Operational sustainability is embedded in business model rather than add-on. Product design explicitly prioritizes repairability and longevity. Circular economy integration is functional, not performative—repair revenue is growing faster than new product revenue, indicating genuine demand-side shift.",
      },
      {
        agentName: "Regulatory compliance",
        score: 91,
        confidence: 0.88,
        keyFindings: [
          "SEC climate disclosure: voluntary reporting since 2019, exceeds proposed rule requirements",
          "EU CSRD: aligned with draft standards 18 months before enforcement",
          "California SB 253: already compliant with Scope 1/2/3 disclosure requirements",
        ],
        dataSource: "SEC EDGAR, EFRAG CSRD standards, California SB 253",
        reasoning: "Regulatory posture is proactive rather than reactive. Disclosure quality exceeds current requirements, positioning the company ahead of regulatory tightening. No evidence of lobbying against climate disclosure rules. Compliance risk is minimal.",
      },
    ],
    devilsAdvocate: {
      targetAgent: "Operations",
      challenge: "Your 72% recycled/regenerative materials claim is directionally correct but masks a substitution problem. 43% of that total is recycled polyester, which is derived from PET bottles—a feedstock that's increasingly allocated to bottle-to-bottle recycling due to regulatory pressure in the EU. Your supply chain depends on a material input that may become constrained. Additionally, microplastic shedding from synthetic textiles is unaccounted in your water intensity metric. You're measuring input water, not pollution output.",
      counterDataSource: "Ellen MacArthur Foundation Circular Economy Report 2024, OECD microplastic leakage data",
      specificDataPoint: "PET bottle collection rate for bottle reuse: 31% → 58% (EU, 2020-2024) - reducing feedstock availability for textile recycling",
    },
    radarData: [
      { dimension: "Energy Systems", score: 88, fullMark: 100 },
      { dimension: "Carbon Accounting", score: 76, fullMark: 100 },
      { dimension: "Operations", score: 82, fullMark: 100 },
      { dimension: "Regulatory Compliance", score: 91, fullMark: 100 },
      { dimension: "Overall Trajectory", score: 84, fullMark: 100 },
    ],
    suggestedQuestions: [
      "How does Scope 3 supplier engagement compare to sector leaders?",
      "What's the carbon payback period for the on-site solar investment?",
      "Is the circular business model scalable to mid-market competitors?",
    ],
    noExpansionActions: [
      {
        action: "Consolidate supplier deliveries from 5 weekly shipments to 2 batched shipments",
        timeframe: "90 days",
        carbonImpact: "Logistics emissions -22%, 340 tCO2e/year",
        cost: "Zero - coordination cost only",
      },
      {
        action: "Shift manufacturing scheduling to off-peak grid hours (10pm-6am) in California facilities",
        timeframe: "6 months",
        carbonImpact: "Scope 2 market-based -9%, coincides with wind generation peak",
        cost: "Zero - labor agreement modification required",
      },
      {
        action: "Replace 3 tier-1 packaging suppliers with lower-carbon alternatives at equivalent cost",
        timeframe: "12 months",
        carbonImpact: "Scope 3 packaging -18%, 890 tCO2e/year",
        cost: "Zero - cost-neutral supplier substitution",
      },
      {
        action: "Extend product warranty from 2 years to 4 years, driving repair over replacement",
        timeframe: "6 months",
        carbonImpact: "Scope 3 use-phase -11% via extended product lifetime",
        cost: "Zero upfront - insurance liability increase absorbed in margin",
      },
    ],
  },
  "east-austin": {
    entity: ENTITIES[4],
    verdict: "DECLINING",
    dissentLevel: "MODERATE",
    dissentScore: 0.42,
    agents: [
      {
        agentName: "Climate resilience",
        score: 38,
        confidence: 0.81,
        keyFindings: [
          "Extreme heat days (>100°F) increased from 14 to 29 annually (2015-2024)",
          "Tree canopy coverage: 12% - lowest in Austin metro area",
          "Urban heat island intensity: +8.2°F above regional average during summer",
        ],
        dataSource: "National climate records and satellite temperature mapping",
        reasoning: "East Austin faces compounding heat vulnerability with minimal natural cooling infrastructure. Vegetation analysis shows net decline in green cover due to development pressure. The area lacks the tree canopy density necessary to mitigate extreme heat exposure.",
      },
      {
        agentName: "Public health",
        score: 44,
        confidence: 0.77,
        keyFindings: [
          "Walkability score: 52/100 - below Austin average of 68",
          "Zero public parks with shade structures within 0.5 mile for 68% of residents",
          "Air quality: AQI stable but ozone exceedances increasing (+18% since 2020)",
        ],
        dataSource: "EPA EnviroAtlas, OpenAQ, Austin Parks Dept GIS",
        reasoning: "Public health infrastructure is inadequate for climate adaptation. The combination of low walkability, insufficient shade, and rising heat creates acute health risk, particularly for outdoor workers and elderly residents.",
      },
      {
        agentName: "Urban development",
        score: 62,
        confidence: 0.73,
        keyFindings: [
          "Construction activity: +220% permits (2020-2024), predominantly luxury apartments",
          "Commercial displacement: 34 local businesses closed, replaced by chain retail",
          "Infrastructure investment: focused on transportation, minimal green infrastructure",
        ],
        dataSource: "Austin building permits and satellite-based construction tracking",
        reasoning: "Development is rapid but extractive. New construction adds density without proportional climate resilience infrastructure. The pattern suggests profit-driven development with minimal community benefit requirements.",
      },
      {
        agentName: "Equity & housing",
        score: 29,
        confidence: 0.86,
        keyFindings: [
          "Historic Latino population declined from 72% (2010) to 48% (2024)",
          "Median rent: +127% since 2015, now $2,340/mo",
          "Median household income: $58,700 - rent burden unsustainable for existing residents",
        ],
        dataSource: "Census ACS, Austin Tenant Council displacement report",
        reasoning: "East Austin is experiencing active cultural and demographic displacement. The sustainability deficit—heat, lack of green space—coincides with economic displacement. Residents face the worst of both: deteriorating climate conditions and unaffordable housing.",
      },
    ],
    devilsAdvocate: {
      targetAgent: "Urban development",
      challenge: "Your 'extractive development' framing ignores the $89M Project Connect transit investment, which includes three new MetroRapid stations in East Austin by 2027. That's public infrastructure specifically designed to serve existing residents, not luxury tenants. The development you're scoring as negative may actually be transit-oriented density that reduces per-capita vehicle emissions. Your score omits the climate benefit of reduced car dependency.",
      counterDataSource: "Capital Metro Project Connect Phase 1, Austin Transportation Dept modal shift analysis",
      specificDataPoint: "East Austin MetroRapid projected ridership: 12,400 daily trips, displacing 6,800 vehicle trips/day = ~4,200 tCO2e annual reduction",
    },
    radarData: [
      { dimension: "Climate Resilience", score: 38, fullMark: 100 },
      { dimension: "Public Health", score: 44, fullMark: 100 },
      { dimension: "Development Quality", score: 62, fullMark: 100 },
      { dimension: "Equity & Access", score: 29, fullMark: 100 },
      { dimension: "Overall Trajectory", score: 43, fullMark: 100 },
    ],
    suggestedQuestions: [
      "What are the highest-impact interventions for this area?",
      "How does this compare to similar rapidly developing neighborhoods?",
      "What's driving the heat island intensity increase?",
    ],
  },
  "tesla": {
    entity: ENTITIES[3],
    verdict: "CONTESTED",
    dissentLevel: "HIGH",
    dissentScore: 0.68,
    agents: [
      {
        agentName: "Energy systems",
        score: 71,
        confidence: 0.79,
        keyFindings: [
          "Gigafactory renewable electricity: 65% solar/wind (2023), target 100% by 2025",
          "Manufacturing energy intensity improving: -8% year-over-year per vehicle produced",
          "Energy storage deployment: 14.7 GWh Megapack installed globally (enabling grid renewables)",
        ],
        dataSource: "Tesla Impact Report 2023, EPA ENERGY STAR data",
        reasoning: "Tesla's operational energy trajectory is improving, and its product (EVs + storage) enables broader grid decarbonization. Manufacturing energy intensity is declining as production scales. The business model is fundamentally aligned with energy transition.",
      },
      {
        agentName: "Carbon accounting",
        score: 54,
        confidence: 0.72,
        keyFindings: [
          "Scope 1+2 emissions: 710,000 tCO2e (2023), intensity declining per vehicle",
          "Scope 3: 92% of footprint, dominated by battery supply chain (lithium, cobalt, nickel)",
          "No SBTi commitment - no third-party validated net-zero pathway",
        ],
        dataSource: "CDP disclosure, SEC 10-K, SBTi registry (absence noted)",
        reasoning: "Carbon accounting is directionally positive but lacks the rigor of SBTi validation. Scope 3 supply chain transparency is poor—supplier emissions data is incomplete, particularly for raw material extraction. The company benefits from EV use-phase emissions avoidance but doesn't fully account for supply chain impact.",
      },
      {
        agentName: "Operations",
        score: 49,
        confidence: 0.68,
        keyFindings: [
          "Battery recycling: operational facility in Nevada, but only 8% of end-of-life batteries currently recycled",
          "Water use: 3.2M gallons/day at Texas Gigafactory in drought-stressed region",
          "Waste diversion: 62% manufacturing waste recycled, below automotive sector median of 71%",
        ],
        dataSource: "Tesla Impact Report, EPA SmartWay, Texas Water Development Board",
        reasoning: "Operational sustainability lags behind energy and product impact. Battery recycling infrastructure exists but uptake is low due to fleet age—most Tesla batteries are still in first use. Water intensity in Texas is a material risk given aquifer depletion trends. Waste performance is below sector average.",
      },
      {
        agentName: "Regulatory compliance",
        score: 67,
        confidence: 0.81,
        keyFindings: [
          "SEC climate disclosure: compliant with current requirements, minimal voluntary disclosure beyond mandates",
          "EU CSRD: readiness unclear, no public alignment assessment published",
          "California SB 253: compliant with Scope 1/2, Scope 3 disclosure incomplete",
        ],
        dataSource: "SEC EDGAR, California Air Resources Board",
        reasoning: "Regulatory posture is compliance-focused rather than leadership-oriented. Tesla discloses what's required but rarely exceeds minimum standards. The company has lobbied against certain right-to-repair legislation that would improve product longevity—counter to circular economy principles.",
      },
    ],
    devilsAdvocate: {
      targetAgent: "Energy systems",
      challenge: "Your use-phase emissions avoidance claim assumes grid average displacement, but a 2024 MIT study shows that incremental EV charging in Texas and California increasingly occurs during natural gas peaker hours due to time-of-use rate structures. The marginal emissions factor for EV charging is 18-34% higher than the grid average you're implicitly using. Your 'enabling grid renewables' framing for Megapack is true in theory but ignores that 43% of deployed units are in diesel displacement applications in off-grid industrial sites—a lower-carbon-intensity use case than grid storage.",
      counterDataSource: "MIT Energy Initiative 2024, Tesla Megapack deployment database (public filings)",
      specificDataPoint: "Marginal emissions factor for EV charging (Texas, 6-9pm): 0.62 kg CO2/kWh vs. grid average 0.42 kg CO2/kWh",
    },
    radarData: [
      { dimension: "Energy Systems", score: 71, fullMark: 100 },
      { dimension: "Carbon Accounting", score: 54, fullMark: 100 },
      { dimension: "Operations", score: 49, fullMark: 100 },
      { dimension: "Regulatory Compliance", score: 67, fullMark: 100 },
      { dimension: "Overall Trajectory", score: 60, fullMark: 100 },
    ],
    suggestedQuestions: [
      "What's the battery recycling pathway at end-of-life scale?",
      "How does water use in Texas align with long-term aquifer sustainability?",
      "Is Tesla's Scope 3 disclosure sufficient for institutional ESG screens?",
    ],
    noExpansionActions: [
      {
        action: "Implement time-of-use charging incentives for Supercharger network to shift load to solar hours",
        timeframe: "6 months",
        carbonImpact: "Grid emissions avoided: ~180,000 tCO2e/year via solar-coincident charging",
        cost: "Zero capex - software update + pricing structure change",
      },
      {
        action: "Require top 20 Scope 3 suppliers to report emissions annually (contractual obligation)",
        timeframe: "12 months",
        carbonImpact: "Enables Scope 3 reduction roadmap covering 67% of supply chain footprint",
        cost: "Zero - supplier compliance requirement",
      },
      {
        action: "Extend battery warranty from 8 years/120k miles to 10 years/150k miles",
        timeframe: "90 days",
        carbonImpact: "Reduces early battery replacement, extends first-life use phase by 18 months on average",
        cost: "Zero upfront - absorbed in product pricing",
      },
    ],
  },
  "amazon": {
    entity: ENTITIES[5],
    verdict: "CONTESTED",
    dissentLevel: "HIGH",
    dissentScore: 0.64,
    agents: [
      {
        agentName: "Energy systems",
        score: 74,
        confidence: 0.78,
        keyFindings: [
          "The Climate Pledge: net-zero carbon across Amazon operations by 2040, 10 years ahead of the Paris Agreement",
          "AWS: progress toward powering operations with 100% renewable energy; large-scale wind/solar PPAs and utility programs for data centers",
          "Energy efficiency: continued investment in facility design, cooling innovation, and power usage effectiveness in hyperscale regions",
        ],
        dataSource: "Amazon Sustainability Report, AWS sustainability and infrastructure disclosures",
        reasoning: "Amazon frames energy systems around The Climate Pledge and AWS electricity procurement. Renewable electricity matching for cloud workloads is material at scale, and efficiency programs reduce intensity per unit of compute. Progress is real but debated on absolute emissions growth versus business scale and on geographic matching of clean power to load.",
      },
      {
        agentName: "Carbon accounting",
        score: 58,
        confidence: 0.74,
        keyFindings: [
          "Disclosure of Scope 1, 2, and 3 with year-over-year tracking in sustainability reporting",
          "Scope 3 dominated by purchased goods, third-party transportation, and customer device use-phase assumptions",
          "Third-party review and methodology evolution; ongoing scrutiny of boundary choices for retail and logistics",
        ],
        dataSource: "Amazon sustainability reporting, CDP climate questionnaire",
        reasoning: "Carbon accounting is relatively transparent for a diversified retailer and logistics operator, but Scope 3 complexity is high. Growth in e-commerce and delivery can outpace intensity improvements in some years, which drives contested interpretations of trajectory.",
      },
      {
        agentName: "Operations",
        score: 52,
        confidence: 0.71,
        keyFindings: [
          "Packaging reduction programs (e.g., Ship in Own Container) and material-lightweighting across fulfillment",
          "Electrification of Amazon-branded delivery and investments in charging where operationally viable",
          "Device take-back and refurbishment pathways for Amazon-branded electronics",
        ],
        dataSource: "Amazon Sustainability Report, operations and packaging updates",
        reasoning: "Operational footprint is shaped by high-throughput fulfillment and last-mile delivery. Initiatives are directionally positive but the core throughput model implies ongoing materials and mobility impacts.",
      },
      {
        agentName: "Regulatory compliance",
        score: 69,
        confidence: 0.79,
        keyFindings: [
          "Alignment workstreams for EU CSRD and evolving U.S. climate disclosure rules",
          "SEC climate-related disclosures tracked against emerging requirements",
          "State-level climate disclosure obligations monitored where Amazon has material operations",
        ],
        dataSource: "SEC EDGAR, EU regulatory summaries, state climate disclosure developments",
        reasoning: "Regulatory exposure is broad given global retail, cloud, and logistics. Posture is largely compliance- and risk-management-oriented with active legal and policy engagement typical of a large platform company.",
      },
    ],
    devilsAdvocate: {
      targetAgent: "Energy systems",
      challenge: "Your Climate Pledge and AWS renewables narrative can overstate decoupling: Amazon's absolute emissions have faced upward pressure in periods when revenue and shipping volumes grew faster than renewable procurement could offset on a short horizon. Renewable electricity instruments do not uniformly equate to hourly load matching in every AWS region, which matters for grid-level decarbonization claims.",
      counterDataSource: "Amazon annual sustainability reporting, independent climate accounting critiques",
      specificDataPoint: "Business growth vs. emissions: multi-year periods where absolute emissions did not fall in line with The Climate Pledge headline pace.",
    },
    radarData: [
      { dimension: "Energy Systems", score: 74, fullMark: 100 },
      { dimension: "Carbon Accounting", score: 58, fullMark: 100 },
      { dimension: "Operations", score: 52, fullMark: 100 },
      { dimension: "Regulatory Compliance", score: 69, fullMark: 100 },
      { dimension: "Overall Trajectory", score: 63, fullMark: 100 },
    ],
    suggestedQuestions: [
      "How does AWS report renewable energy matching by region versus customer workload location?",
      "What is the net-zero pathway for third-party carrier and upstream manufacturing emissions?",
      "Which packaging changes have the highest avoided waste per dollar shipped?",
    ],
    noExpansionActions: [
      {
        action: "Batch same-day delivery windows by default to raise vehicle utilization",
        timeframe: "6 months",
        carbonImpact: "Fewer partial-truck miles per order basket in dense metros",
        cost: "Product experiment and CX testing",
      },
      {
        action: "Expand supplier emissions reporting for Amazon-branded consumer electronics",
        timeframe: "12 months",
        carbonImpact: "Improves Scope 3 traceability for high-carbon categories",
        cost: "Procurement contract updates",
      },
      {
        action: "Accelerate depot charging for electric delivery vans at top 20 U.S. fulfillment nodes",
        timeframe: "18 months",
        carbonImpact: "Reduces tailpipe emissions in urban last-mile corridors",
        cost: "Charging capex and electrical upgrades",
      },
    ],
  },
  "apple": {
    entity: ENTITIES[9],
    verdict: "IMPROVING",
    dissentLevel: "LOW",
    dissentScore: 0.28,
    agents: [
      {
        agentName: "Energy systems",
        score: 86,
        confidence: 0.9,
        keyFindings: [
          "Apple corporate operations run on 100% renewable electricity (market-based methodology)",
          "Supplier Clean Energy Program: progress toward renewable manufacturing for key suppliers",
          "Data center and Apple retail energy efficiency programs with third-party audited footprints",
        ],
        dataSource: "Apple Environmental Progress Report, CDP supplier engagement data",
        reasoning: "Apple's energy strategy emphasizes renewable procurement for corporate facilities and deep supplier engagement for manufacturing load. The model is among the stronger technology-hardware examples for Scope 2 management at scale.",
      },
      {
        agentName: "Carbon accounting",
        score: 78,
        confidence: 0.84,
        keyFindings: [
          "Corporate carbon neutral claim for global corporate operations",
          "Product carbon footprint modeling for key devices with lifecycle disclosure",
          "Science-based targets and progress reporting across Scopes 1–3",
        ],
        dataSource: "Apple Environmental Progress Report, SBTi registry",
        reasoning: "Carbon accounting integrates product-level lifecycle thinking with corporate targets. Scope 3 remains large due to manufacturing and use-phase electricity assumptions, but disclosure quality is above sector median.",
      },
      {
        agentName: "Operations",
        score: 80,
        confidence: 0.8,
        keyFindings: [
          "Recycling and recovery programs (e.g., Daisy disassembly) and recycled content in select materials",
          "Design for longevity and repair ecosystem through authorized service network",
          "Water stewardship programs for manufacturing partners in stressed basins",
        ],
        dataSource: "Apple Environmental Progress Report, supplier responsibility reports",
        reasoning: "Operational sustainability is tied to product design, materials, and end-of-life pathways. Trade-offs exist between miniaturization and repairability, but material recovery investments are concrete.",
      },
      {
        agentName: "Regulatory compliance",
        score: 88,
        confidence: 0.85,
        keyFindings: [
          "EU regulatory readiness for ecodesign, batteries, and digital product passports (where applicable)",
          "U.S. SEC climate disclosure alignment with evolving requirements",
          "California supply chain transparency and recycling program compliance",
        ],
        dataSource: "SEC EDGAR, EU regulatory trackers, California recycling program filings",
        reasoning: "Compliance posture is proactive for a consumer electronics leader; regulatory surface area is large across chemicals, waste, and climate disclosure.",
      },
    ],
    devilsAdvocate: {
      targetAgent: "Operations",
      challenge: "Your recycled-content claims for aluminum and rare earth pathways are meaningful but do not eliminate mining intensity for new device demand. High refresh rates for premium smartphones can dominate lifecycle emissions regardless of grid improvements. Repair restrictions and part pairing remain friction points for true circularity.",
      counterDataSource: "IFIXIT repairability scores, lifecycle assessment literature on smartphone replacement cycles",
      specificDataPoint: "Replacement cycle sensitivity: shortening average ownership by one year can outweigh marginal grid decarbonization per device.",
    },
    radarData: [
      { dimension: "Energy Systems", score: 86, fullMark: 100 },
      { dimension: "Carbon Accounting", score: 78, fullMark: 100 },
      { dimension: "Operations", score: 80, fullMark: 100 },
      { dimension: "Regulatory Compliance", score: 88, fullMark: 100 },
      { dimension: "Overall Trajectory", score: 83, fullMark: 100 },
    ],
    suggestedQuestions: [
      "How does supplier clean energy translate to each product line carbon footprint?",
      "What is the marginal impact of longer software support on device lifetime emissions?",
      "Where are the largest residual Scope 3 hotspots after grid decarbonization?",
    ],
    noExpansionActions: [
      {
        action: "Expand independent repair provider access to calibration tools for displays and batteries",
        timeframe: "12 months",
        carbonImpact: "Extends first-life use, reduces premature replacement",
        cost: "Program and tooling distribution",
      },
      {
        action: "Incentivize trade-in at carrier partners with verified refurbishment routing",
        timeframe: "6 months",
        carbonImpact: "Improves recovery rates for high-value components",
        cost: "Trade-in subsidy coordination",
      },
      {
        action: "Shift final assembly scheduling to maximize renewable-heavy grid hours in key regions",
        timeframe: "9 months",
        carbonImpact: "Small Scope 3 manufacturing electricity reduction at margin",
        cost: "Production planning changes",
      },
    ],
  },
  "google": {
    entity: ENTITIES[10],
    verdict: "IMPROVING",
    dissentLevel: "MODERATE",
    dissentScore: 0.41,
    agents: [
      {
        agentName: "Energy systems",
        score: 82,
        confidence: 0.86,
        keyFindings: [
          "24/7 carbon-free energy (CFE) goal for Google data centers and campuses",
          "Power purchase agreements and grid investments to add new renewable capacity",
          "Data center efficiency: cooling innovation and machine-learning operations for workload placement",
        ],
        dataSource: "Google Environmental Report, public data center efficiency disclosures",
        reasoning: "Google's energy systems narrative centers on matching hourly electricity use with carbon-free generation where feasible, supported by large renewable procurement. Hyperscale computing growth keeps absolute electricity demand in focus.",
      },
      {
        agentName: "Carbon accounting",
        score: 72,
        confidence: 0.8,
        keyFindings: [
          "Historical carbon neutrality for operations with continued decarbonization investments",
          "Scope 3 categories including cloud customer use, hardware supply chain, and employee travel",
          "Transparency improvements on methodology for market-based Scope 2 accounting",
        ],
        dataSource: "Google Environmental Report, CDP climate disclosure",
        reasoning: "Carbon accounting is relatively mature for a digital infrastructure company, but Scope 3 interpretation for cloud services remains contested across customer responsibility boundaries.",
      },
      {
        agentName: "Operations",
        score: 68,
        confidence: 0.74,
        keyFindings: [
          "Water stewardship targets for data center cooling in stressed watersheds",
          "Circular approaches for hardware in data centers and office operations",
          "Sustainable procurement for food services and workplace operations",
        ],
        dataSource: "Google Environmental Report, water risk disclosures",
        reasoning: "Operational sustainability extends beyond electricity to water and materials. Data center water use is a flashpoint in arid regions despite efficiency gains.",
      },
      {
        agentName: "Regulatory compliance",
        score: 84,
        confidence: 0.82,
        keyFindings: [
          "EU Digital Services Act and sustainability-related compliance where intersecting product rules apply",
          "U.S. and EU climate disclosure evolution tracked with published governance processes",
          "Energy reporting for large facilities in jurisdictions with benchmarking rules",
        ],
        dataSource: "SEC EDGAR, EU regulatory summaries, municipal energy benchmarking databases",
        reasoning: "Regulatory engagement is active; the company faces both climate disclosure expectations and platform policy obligations globally.",
      },
    ],
    devilsAdvocate: {
      targetAgent: "Energy systems",
      challenge: "Your 24/7 CFE ambition is credible as a roadmap but incomplete today in many grids: residual fossil generation still shapes marginal emissions during peak AI training bursts. PPAs may not be physically deliverable hour-by-hour in every region where capacity is leased to customers.",
      counterDataSource: "Grid marginal emissions studies, Google hourly CFE reporting limitations",
      specificDataPoint: "Peak GPU cluster load alignment vs. local grid carbon intensity during evening peaks.",
    },
    radarData: [
      { dimension: "Energy Systems", score: 82, fullMark: 100 },
      { dimension: "Carbon Accounting", score: 72, fullMark: 100 },
      { dimension: "Operations", score: 68, fullMark: 100 },
      { dimension: "Regulatory Compliance", score: 84, fullMark: 100 },
      { dimension: "Overall Trajectory", score: 77, fullMark: 100 },
    ],
    suggestedQuestions: [
      "How is hourly CFE reported by region for Google Cloud availability zones?",
      "What is the net water outcome after operational and watershed investments?",
      "How does Google allocate cloud customer emissions across shared infrastructure?",
    ],
    noExpansionActions: [
      {
        action: "Shift batch inference jobs to regions with surplus daytime renewables",
        timeframe: "6 months",
        carbonImpact: "Reduces marginal fossil generation per unit of compute",
        cost: "Scheduler and networking latency trade-offs",
      },
      {
        action: "Expand air-cooled and liquid-cooled efficiency retrofits in highest water-stress sites",
        timeframe: "18 months",
        carbonImpact: "Indirect emissions from water supply energy reduced",
        cost: "Retrofit capex",
      },
      {
        action: "Publish supplier-specific chip fab energy intensity targets",
        timeframe: "12 months",
        carbonImpact: "Sharpens Scope 3 hotspot management for AI accelerators",
        cost: "Procurement negotiation overhead",
      },
    ],
  },
  "nvidia": {
    entity: ENTITIES[11],
    verdict: "CONTESTED",
    dissentLevel: "HIGH",
    dissentScore: 0.62,
    agents: [
      {
        agentName: "Energy systems",
        score: 69,
        confidence: 0.75,
        keyFindings: [
          "Data center GPUs: performance-per-watt improvements across generations reduce energy per training/inference task",
          "Liquid cooling and high-density rack designs shift facility energy budgets toward cooling optimization",
          "Customer responsibility: majority of operational electricity sits in purchaser-owned data centers",
        ],
        dataSource: "NVIDIA product briefs, data center TDP disclosures, industry power benchmarks",
        reasoning: "NVIDIA's energy story is largely about enabling more compute per watt at the chip level, while absolute demand rises with AI scale. The company influences but does not control how customers power fleets.",
      },
      {
        agentName: "Carbon accounting",
        score: 55,
        confidence: 0.7,
        keyFindings: [
          "Corporate Scope 1 and 2 footprint for offices, labs, and logistics",
          "Scope 3 dominated by manufacturing, supply chain, and product use-phase in downstream data centers",
          "Rapid revenue growth can outpace short-term intensity improvements",
        ],
        dataSource: "NVIDIA corporate sustainability reporting, CDP",
        reasoning: "Carbon accounting is improving in disclosure but AI demand growth complicates simple trajectory narratives. Use-phase emissions are enormous but attributed downstream.",
      },
      {
        agentName: "Operations",
        score: 51,
        confidence: 0.69,
        keyFindings: [
          "Semiconductor manufacturing water use and chemical handling at foundry partners",
          "Packaging and logistics for high-value accelerators",
          "End-of-life recycling programs for select professional GPUs where deployed",
        ],
        dataSource: "Supplier responsibility summaries, semiconductor industry water benchmarks",
        reasoning: "Operational impacts concentrate in the fabless-plus-supply-chain model: foundries carry heavy water and chemical footprints, while NVIDIA manages design and customer enablement.",
      },
      {
        agentName: "Regulatory compliance",
        score: 64,
        confidence: 0.77,
        keyFindings: [
          "Export controls and trade compliance intersect with sustainability reporting for global shipments",
          "U.S. and EU climate disclosure expectations for large filers",
          "Emerging rules on supply chain due diligence for critical minerals",
        ],
        dataSource: "SEC EDGAR, EU CSRD materials, U.S. export control filings",
        reasoning: "Regulatory complexity is rising with geopolitical controls on advanced semiconductors, layered atop climate disclosure.",
      },
    ],
    devilsAdvocate: {
      targetAgent: "Energy systems",
      challenge: "Your performance-per-watt story ignores Jevons-style rebound: cheaper AI per watt can expand total electricity demand faster than efficiency saves. Framing GPUs as 'green' because they beat prior-generation accelerators sidesteps the aggregate data center build-out driven by AI workloads.",
      counterDataSource: "IEA data center electricity outlook, academic rebound-effect literature",
      specificDataPoint: "Global AI cluster capacity additions vs. grid renewable additions in the same regions (timing mismatch).",
    },
    radarData: [
      { dimension: "Energy Systems", score: 69, fullMark: 100 },
      { dimension: "Carbon Accounting", score: 55, fullMark: 100 },
      { dimension: "Operations", score: 51, fullMark: 100 },
      { dimension: "Regulatory Compliance", score: 64, fullMark: 100 },
      { dimension: "Overall Trajectory", score: 60, fullMark: 100 },
    ],
    suggestedQuestions: [
      "How should Scope 3 attribute data center power for sold accelerators?",
      "What foundry water targets apply to NVIDIA's leading-edge allocation?",
      "Which cooling architectures minimize facility energy at equal SLA?",
    ],
    noExpansionActions: [
      {
        action: "Publish reference power caps and thermal envelopes for large training clusters",
        timeframe: "6 months",
        carbonImpact: "Helps customers right-size facility power and cooling",
        cost: "Documentation and validation",
      },
      {
        action: "Partner with hyperscalers on joint renewable procurement for new AI regions",
        timeframe: "18 months",
        carbonImpact: "Improves grid additionality for marginal AI load",
        cost: "Commercial agreements",
      },
      {
        action: "Expand take-back for professional accelerators in regulated enterprise fleets",
        timeframe: "12 months",
        carbonImpact: "Improves recovery of high-value metals",
        cost: "Logistics and refurbishment",
      },
    ],
  },
  "samsung": {
    entity: ENTITIES[12],
    verdict: "CONTESTED",
    dissentLevel: "MODERATE",
    dissentScore: 0.47,
    agents: [
      {
        agentName: "Energy systems",
        score: 71,
        confidence: 0.77,
        keyFindings: [
          "RE100 commitment and renewable electricity procurement for global operations",
          "Semiconductor and display fabs: intensive electricity demand with efficiency and process-node improvements",
          "On-site solar and energy storage pilots at select manufacturing sites",
        ],
        dataSource: "Samsung Sustainability Report, RE100 filings, industry fab energy benchmarks",
        reasoning: "Samsung's energy profile is dominated by manufacturing scale. Renewable electricity targets are material but chip fabrication growth keeps attention on absolute consumption.",
      },
      {
        agentName: "Carbon accounting",
        score: 57,
        confidence: 0.73,
        keyFindings: [
          "Scope 1 and 2 disclosure for large manufacturing bases, including South Korea and Vietnam",
          "Scope 3 across supply chain, product use, and end-of-life for consumer electronics",
          "Net-zero targets with interim milestones under external initiatives",
        ],
        dataSource: "Samsung sustainability reporting, CDP",
        reasoning: "Carbon accounting is broad and complex due to diversified electronics and appliances. Progress is uneven across business units and geographies.",
      },
      {
        agentName: "Operations",
        score: 54,
        confidence: 0.7,
        keyFindings: [
          "Water use and wastewater management for fabs with regional stress considerations",
          "Packaging take-back and recycling programs in select markets",
          "Durability and energy-label performance for appliances and displays",
        ],
        dataSource: "Samsung Sustainability Report, semiconductor water risk disclosures",
        reasoning: "Operational sustainability mixes consumer product efficiency with heavy industrial water and chemical footprints in advanced manufacturing.",
      },
      {
        agentName: "Regulatory compliance",
        score: 66,
        confidence: 0.78,
        keyFindings: [
          "EU ecodesign, energy labeling, and batteries regulation compliance for appliances and mobile",
          "K-ESG and global climate disclosure expectations",
          "U.S. import and trade compliance alongside sustainability reporting",
        ],
        dataSource: "EU product regulations, Korean disclosure frameworks, SEC filings for ADRs",
        reasoning: "Regulatory surface spans multiple continents; appliance and mobile rules intersect with climate and materials policy.",
      },
    ],
    devilsAdvocate: {
      targetAgent: "Energy systems",
      challenge: "Your renewable electricity share gains can lag new fab capacity in Asia where grids remain coal-heavy in marginal hours. RE100 progress does not automatically equal hourly clean power for 24/7 semiconductor loads.",
      counterDataSource: "IEA electricity mix data, RE100 technical criteria discussions",
      specificDataPoint: "Marginal grid emissions during peak fab load in coal-intensive regions.",
    },
    radarData: [
      { dimension: "Energy Systems", score: 71, fullMark: 100 },
      { dimension: "Carbon Accounting", score: 57, fullMark: 100 },
      { dimension: "Operations", score: 54, fullMark: 100 },
      { dimension: "Regulatory Compliance", score: 66, fullMark: 100 },
      { dimension: "Overall Trajectory", score: 62, fullMark: 100 },
    ],
    suggestedQuestions: [
      "How is renewable electricity allocated across fabs vs. mobile assembly?",
      "What are the top three Scope 3 hotspots for Galaxy vs. appliance lines?",
      "Where is water risk highest in the semiconductor supply chain?",
    ],
    noExpansionActions: [
      {
        action: "Pair new fab load with dedicated renewable PPAs in the same grid zone",
        timeframe: "24 months",
        carbonImpact: "Reduces market-based Scope 2 for new capacity",
        cost: "Energy contract structuring",
      },
      {
        action: "Expand modular phone battery replacement programs in major EU markets",
        timeframe: "12 months",
        carbonImpact: "Extends device life, reduces manufacturing churn",
        cost: "Service network training",
      },
      {
        action: "Publish supplier tier-1 foundry water intensity targets",
        timeframe: "12 months",
        carbonImpact: "Sharpens accountability for high-stress basins",
        cost: "Supplier engagement",
      },
    ],
  },
  "hub-austin-tx": {
    entity: ENTITIES[13],
    verdict: "DECLINING",
    dissentLevel: "MODERATE",
    dissentScore: 0.45,
    agents: [
      {
        agentName: "Climate resilience",
        score: 41,
        confidence: 0.8,
        keyFindings: [
          "Central Texas extreme heat days trending up; urban heat island across I-35 corridor",
          "Flash flood risk from intense rainfall on expanding impervious cover",
          "Drought stress on landscaping and urban trees in fast-growing suburbs",
        ],
        dataSource: "NOAA climate summaries, Austin urban heat studies, floodplain GIS",
        reasoning: "Austin metro growth increases exposed population to heat and flood extremes simultaneously. Regional resilience planning is racing against development pace.",
      },
      {
        agentName: "Public health",
        score: 46,
        confidence: 0.76,
        keyFindings: [
          "Ozone season challenges with vehicle miles traveled rising in outer suburbs",
          "Active transportation gaps: sidewalk completeness uneven outside urban core",
          "Heat-related illness ED visits spike on triple-digit days region-wide",
        ],
        dataSource: "EPA AirNow trends, Capital Area MPO travel surveys, hospital heat syndromic data",
        reasoning: "Public health outcomes are sensitive to car dependence and outdoor labor exposure during heat waves.",
      },
      {
        agentName: "Urban development",
        score: 63,
        confidence: 0.74,
        keyFindings: [
          "High inward migration and tech-sector expansion driving housing demand",
          "Sprawl versus infill tension with affordability consequences",
          "Transit investments (e.g., Project Connect) attempting to reshape mode share",
        ],
        dataSource: "Census migration data, Austin housing pipeline reports, Capital Metro plans",
        reasoning: "Development quality is mixed: density increases in core areas but regional growth still expands car-oriented fringe development.",
      },
      {
        agentName: "Equity & housing",
        score: 33,
        confidence: 0.85,
        keyFindings: [
          "Median rents rose faster than wages for service-sector workers region-wide",
          "Displacement pressure in historically lower-cost corridors east of downtown",
          "Energy burden rises when inefficient housing stock meets higher cooling demand",
        ],
        dataSource: "Census ACS, local tenant advocacy reports, utility affordability programs",
        reasoning: "Climate and housing inequities compound: those least able to afford retrofits face the highest exposure.",
      },
    ],
    devilsAdvocate: {
      targetAgent: "Urban development",
      challenge: "Your sprawl critique understates distributed solar adoption and new grid-scale renewables in ERCOT that improve per-capita grid carbon intensity even as VMT rises. Austin's climate story is not only land use—it's also power-sector transition speed.",
      counterDataSource: "ERCOT fuel mix data, Austin Energy renewable procurement reports",
      specificDataPoint: "Rising renewable share on ERCOT vs. decade-ago baseline.",
    },
    radarData: [
      { dimension: "Climate Resilience", score: 41, fullMark: 100 },
      { dimension: "Public Health", score: 46, fullMark: 100 },
      { dimension: "Development Quality", score: 63, fullMark: 100 },
      { dimension: "Equity & Access", score: 33, fullMark: 100 },
      { dimension: "Overall Trajectory", score: 46, fullMark: 100 },
    ],
    suggestedQuestions: [
      "Where are the highest heat-vulnerable block groups in Travis County?",
      "How does Project Connect change per-capita transportation emissions?",
      "Which affordable housing retrofit programs target attic insulation and heat pumps?",
    ],
  },
  "hub-boston-ma": {
    entity: ENTITIES[14],
    verdict: "CONTESTED",
    dissentLevel: "MODERATE",
    dissentScore: 0.48,
    agents: [
      {
        agentName: "Climate resilience",
        score: 48,
        confidence: 0.78,
        keyFindings: [
          "Coastal and riverine flood exposure in harbor neighborhoods and Charles River watershed",
          "Nor'easter intensity variability and winter storm surge risk",
          "Urban heat island moderated by ocean influence but heat waves still rising",
        ],
        dataSource: "NOAA tide gauges, FEMA flood maps, Boston climate readiness plans",
        reasoning: "Greater Boston combines sea-level risk with aging stormwater infrastructure. Resilience investments are substantial but unevenly distributed.",
      },
      {
        agentName: "Public health",
        score: 58,
        confidence: 0.75,
        keyFindings: [
          "MBTA access reduces car dependence for core commuters but system reliability affects ridership",
          "Air quality generally better than megacity peers; residual diesel and aviation impacts near Logan",
          "Tree canopy inequity between wealthier suburbs and environmental justice communities",
        ],
        dataSource: "Massachusetts DPH, MBTA performance metrics, urban tree canopy studies",
        reasoning: "Public health is shaped by transit availability, housing quality, and legacy industrial sites in pockets of the metro.",
      },
      {
        agentName: "Urban development",
        score: 61,
        confidence: 0.72,
        keyFindings: [
          "Lab and life-sciences construction boom around Cambridge and Seaport",
          "Zoning reforms pushing multifamily near transit in inner suburbs",
          "Legacy single-family zoning still constrains housing supply in many towns",
        ],
        dataSource: "MA building permits, MAPC land-use tracking",
        reasoning: "Development is innovation-sector driven with acute housing cost pressures and commuter-shed expansion.",
      },
      {
        agentName: "Equity & housing",
        score: 36,
        confidence: 0.84,
        keyFindings: [
          "High housing costs push lower-wage workers to longer commutes",
          "Energy burden in older triple-decker housing with poor insulation",
          "Flood insurance affordability issues in coastal environmental justice communities",
        ],
        dataSource: "Census ACS, MA affordable housing waitlists, NFIP data",
        reasoning: "Equity challenges intersect climate: those with least agency face longest commutes and highest flood/energy burdens.",
      },
    ],
    devilsAdvocate: {
      targetAgent: "Climate resilience",
      challenge: "Your coastal flood framing can overstate near-term exposure for inland MetroWest growth centers where development is actually concentrated. Risk is hyperlocal; a single regional score obscures winners and losers.",
      counterDataSource: "Municipal vulnerability assessments, parcel-scale flood models",
      specificDataPoint: "Share of new units in FEMA AE zones vs. inland multifamily infill.",
    },
    radarData: [
      { dimension: "Climate Resilience", score: 48, fullMark: 100 },
      { dimension: "Public Health", score: 58, fullMark: 100 },
      { dimension: "Development Quality", score: 61, fullMark: 100 },
      { dimension: "Equity & Access", score: 36, fullMark: 100 },
      { dimension: "Overall Trajectory", score: 51, fullMark: 100 },
    ],
    suggestedQuestions: [
      "Which MBTA corridors have the highest mode-shift potential for decarbonization?",
      "How does cloudburst infrastructure investment compare across municipalities?",
      "Where is tree canopy lowest relative to heat vulnerability?",
    ],
  },
  "hub-new-york-ny": {
    entity: ENTITIES[15],
    verdict: "CONTESTED",
    dissentLevel: "HIGH",
    dissentScore: 0.58,
    agents: [
      {
        agentName: "Climate resilience",
        score: 44,
        confidence: 0.79,
        keyFindings: [
          "Coastal storm surge and subway flooding risk (e.g., post-hurricane impacts)",
          "Urban heat island with limited canopy in industrialized corridors",
          "Cloudburst sewer capacity challenges during intense rainfall",
        ],
        dataSource: "NYC DEP climate resilience plans, NOAA, MTA climate adaptation reports",
        reasoning: "NYC's density is an efficiency advantage for transit but concentrates exposure during extreme events. Interdependent infrastructure (power, transit, water) amplifies risk.",
      },
      {
        agentName: "Public health",
        score: 55,
        confidence: 0.74,
        keyFindings: [
          "Local Law 97 driving building decarbonization; implementation uneven by building class",
          "Air quality improved long-term but congestion and trucking still elevate PM2.5 in corridors",
          "Heat mortality risk for elderly in non-air-conditioned housing",
        ],
        dataSource: "NYC DOHMH heat vulnerability index, DEC air monitoring, LL97 compliance data",
        reasoning: "Public health outcomes hinge on housing quality, cooling access, and chronic air pollution hotspots near highways.",
      },
      {
        agentName: "Urban development",
        score: 66,
        confidence: 0.73,
        keyFindings: [
          "Transit-oriented density in borough cores vs. car-oriented fringes in outer Queens/Staten Island",
          "Office-to-residential conversions altering midtown and downtown energy profiles",
          "Industrial waterfront rezoning with environmental justice scrutiny",
        ],
        dataSource: "NYC DCP zoning data, building permit analytics",
        reasoning: "Development patterns are among the most complex nationally; climate policy (LL97) is reshaping building operations at scale.",
      },
      {
        agentName: "Equity & housing",
        score: 31,
        confidence: 0.87,
        keyFindings: [
          "Extreme rent burden across low-income households despite rent stabilization in parts of stock",
          "Environmental justice communities near highways and industrial zones",
          "Recovery capacity after extreme weather varies sharply by neighborhood wealth",
        ],
        dataSource: "Census ACS, NYC HPD, community board environmental justice statements",
        reasoning: "Equity and climate interact tightly: housing instability reduces adaptive capacity for heat and flooding.",
      },
    ],
    devilsAdvocate: {
      targetAgent: "Urban development",
      challenge: "Your density narrative understates per-capita efficiency: NYC household transportation emissions are far below U.S. average despite aging buildings. LL97 may be painful, but it targets the true operational carbon of dense housing.",
      counterDataSource: "NYC GHG inventory, EPA per-capita transportation comparisons",
      specificDataPoint: "Per-capita transportation CO2 vs. U.S. metro median.",
    },
    radarData: [
      { dimension: "Climate Resilience", score: 44, fullMark: 100 },
      { dimension: "Public Health", score: 55, fullMark: 100 },
      { dimension: "Development Quality", score: 66, fullMark: 100 },
      { dimension: "Equity & Access", score: 31, fullMark: 100 },
      { dimension: "Overall Trajectory", score: 49, fullMark: 100 },
    ],
    suggestedQuestions: [
      "Which Community Boards have the highest heat-mortality risk?",
      "How fast is LL97 retrofit activity progressing in rent-stabilized housing?",
      "Where are cloudburst capital projects prioritized vs. historical flood complaints?",
    ],
  },
  "hub-san-francisco-ca": {
    entity: ENTITIES[16],
    verdict: "CONTESTED",
    dissentLevel: "HIGH",
    dissentScore: 0.61,
    agents: [
      {
        agentName: "Climate resilience",
        score: 42,
        confidence: 0.78,
        keyFindings: [
          "Wildfire smoke episodes degrading regional air quality and public health",
          "Sea-level rise affecting shoreline infrastructure and wastewater systems",
          "Drought cycles interacting with imported water portfolios and conservation mandates",
        ],
        dataSource: "CARB smoke data, Bay Conservation and Development Commission, regional water agency reports",
        reasoning: "The Bay Area faces compound climate stresses: smoke, drought, and coastal inundation—each with different geographies within the metro.",
      },
      {
        agentName: "Public health",
        score: 52,
        confidence: 0.75,
        keyFindings: [
          "Traffic and goods movement PM exposure along I-880/I-580 corridors",
          "Heat islands in inland East Bay vs. marine-cooled San Francisco",
          "Disparities in indoor air filtration during smoke events by income",
        ],
        dataSource: "Bay Area AQMD, CDC PLACES, school air filtration surveys",
        reasoning: "Public health is stratified by geography and income; smoke events are regional but protections are not.",
      },
      {
        agentName: "Urban development",
        score: 59,
        confidence: 0.72,
        keyFindings: [
          "Housing underproduction and jobs/housing imbalance sustaining long commutes",
          "BART expansion and bus lane investments uneven across counties",
          "Industrial legacy contamination constraining some infill",
        ],
        dataSource: "ABAG housing needs, MTC travel surveys, DTSC cleanup databases",
        reasoning: "Development is constrained politically and environmentally; the result is high costs and persistent supercommuting.",
      },
      {
        agentName: "Equity & housing",
        score: 28,
        confidence: 0.86,
        keyFindings: [
          "Service workers commuting from distant Central Valley due to housing costs",
          "Gentrification pressures in historically lower-cost corridors near job centers",
          "Energy retrofit access gated by landlord-tenant split incentives",
        ],
        dataSource: "Census ACS, regional equity analyses, CPUC low-income energy programs",
        reasoning: "Climate and equity intersect through displacement: those priced out bear longer, more polluting commutes.",
      },
    ],
    devilsAdvocate: {
      targetAgent: "Climate resilience",
      challenge: "Your smoke-risk framing can ignore rapid grid decarbonization in California: marginal electricity is far cleaner than a decade ago, improving heat-pump and EV benefits even when smoke forces indoor living.",
      counterDataSource: "CAISO fuel mix data, CPUC renewable procurement dockets",
      specificDataPoint: "California grid GHG intensity trend vs. 2010 baseline.",
    },
    radarData: [
      { dimension: "Climate Resilience", score: 42, fullMark: 100 },
      { dimension: "Public Health", score: 52, fullMark: 100 },
      { dimension: "Development Quality", score: 59, fullMark: 100 },
      { dimension: "Equity & Access", score: 28, fullMark: 100 },
      { dimension: "Overall Trajectory", score: 45, fullMark: 100 },
    ],
    suggestedQuestions: [
      "Which census tracts combine smoke exposure with low filtration rates?",
      "Where is infill fastest relative to transit access?",
      "How does water portfolio risk vary for East Bay vs. Peninsula utilities?",
    ],
  },
  "hub-seattle-wa": {
    entity: ENTITIES[17],
    verdict: "CONTESTED",
    dissentLevel: "MODERATE",
    dissentScore: 0.52,
    agents: [
      {
        agentName: "Climate resilience",
        score: 50,
        confidence: 0.77,
        keyFindings: [
          "Hydropower-heavy grid reduces operational carbon but wildfire smoke increasingly common",
          "Urban heat rising during Pacific Northwest heat dome events",
          "Saltwater intrusion and shoreline infrastructure risk in Puget Sound communities",
        ],
        dataSource: "Northwest climate impacts assessments, Seattle City Light fuel mix, wildfire smoke monitoring",
        reasoning: "Seattle's climate story combines a relatively clean grid with growing acute heat and smoke risks that older housing stock is ill-prepared for.",
      },
      {
        agentName: "Public health",
        score: 56,
        confidence: 0.74,
        keyFindings: [
          "Transit and bike mode share high in core neighborhoods; suburban VMT remains significant",
          "Homelessness and housing instability affect exposure to heat and smoke",
          "Duwamish Valley industrial legacy pollution overlapping with equity concerns",
        ],
        dataSource: "King County health assessments, EPA EJSCREEN, SDOT mode share",
        reasoning: "Public health outcomes reflect both transportation patterns and environmental justice legacies along industrial waterways.",
      },
      {
        agentName: "Urban development",
        score: 64,
        confidence: 0.73,
        keyFindings: [
          "Tech-sector job growth concentrating in Seattle and Eastside",
          "Missing middle housing debates in single-family neighborhoods",
          "Light rail expansion reshaping station-area development",
        ],
        dataSource: "PSRC growth reports, Sound Transit ridership, building permit data",
        reasoning: "Development pressure is high; affordability and displacement track regional boom cycles.",
      },
      {
        agentName: "Equity & housing",
        score: 35,
        confidence: 0.84,
        keyFindings: [
          "Long commutes from lower-cost Pierce and Snohomish suburbs for service workers",
          "Energy burden in older electrically heated apartments without efficient heat pumps",
          "Displacement risk in rapidly appreciating neighborhoods",
        ],
        dataSource: "Census ACS, Housing Connector reports, utility bill assistance data",
        reasoning: "Equity and climate intersect through housing quality and commute length—both worsen under cost pressure.",
      },
    ],
    devilsAdvocate: {
      targetAgent: "Climate resilience",
      challenge: "Your smoke narrative should credit regional building code improvements and heat-pump adoption incentives that reduce indoor exposure and operational carbon simultaneously—Seattle is not static on adaptation.",
      counterDataSource: "Washington State Energy Code adoption data, utility incentive programs",
      specificDataPoint: "Heat pump installation growth in King County single-family retrofits.",
    },
    radarData: [
      { dimension: "Climate Resilience", score: 50, fullMark: 100 },
      { dimension: "Public Health", score: 56, fullMark: 100 },
      { dimension: "Development Quality", score: 64, fullMark: 100 },
      { dimension: "Equity & Access", score: 35, fullMark: 100 },
      { dimension: "Overall Trajectory", score: 51, fullMark: 100 },
    ],
    suggestedQuestions: [
      "Where is indoor heat risk highest during heat domes?",
      "How does Sound Transit mode share change with new openings?",
      "Which communities combine Duwamish exposure with flood risk?",
    ],
  },
  "hub-washington-dc": {
    entity: ENTITIES[18],
    verdict: "CONTESTED",
    dissentLevel: "MODERATE",
    dissentScore: 0.49,
    agents: [
      {
        agentName: "Climate resilience",
        score: 54,
        confidence: 0.78,
        keyFindings: [
          "Potomac and Anacostia watershed flooding and stormwater overflow challenges",
          "Urban heat island across concrete-heavy federal core vs. greener wards",
          "Sea-level influence on tidal Potomac infrastructure downstream",
        ],
        dataSource: "DC ISWG climate plans, USGS stream gauges, urban heat mapping",
        reasoning: "The DMV combines riverine flood risk with inequitable heat exposure. Federal campuses and national security priorities complicate regional coordination.",
      },
      {
        agentName: "Public health",
        score: 57,
        confidence: 0.75,
        keyFindings: [
          "WMATA ridership recovery uneven; car dependence persists in outer suburbs",
          "Air quality improved long-term but traffic corridors remain PM hotspots",
          "Asthma and cardiovascular disparities track historically redlined corridors",
        ],
        dataSource: "DC DOH, EPA EJSCREEN, CDC PLACES",
        reasoning: "Public health reflects legacy segregation, highway siting, and unequal tree canopy.",
      },
      {
        agentName: "Urban development",
        score: 60,
        confidence: 0.72,
        keyFindings: [
          "Office vacancy pressuring downtown adaptive reuse debates",
          "Growth in Northern Virginia data centers raising grid and water questions",
          "Zoning reforms in DC and Maryland suburbs attempting to unlock multifamily",
        ],
        dataSource: "Metropolitan Washington Council of Governments, building permits, utility interconnection queues",
        reasoning: "Development dynamics are bifurcated: urban core softness versus suburban power and compute growth.",
      },
      {
        agentName: "Equity & housing",
        score: 37,
        confidence: 0.84,
        keyFindings: [
          "High costs push essential workers to longer Prince George's and southern Maryland commutes",
          "Energy burden in older multifamily housing without deep retrofits",
          "Flood risk concentrated in vulnerable Anacostia watershed communities",
        ],
        dataSource: "Census ACS, DC Sustainable Energy Utility reports, flood insurance analyses",
        reasoning: "Equity, housing, and climate risk align along historical lines of disinvestment.",
      },
    ],
    devilsAdvocate: {
      targetAgent: "Urban development",
      challenge: "Your data-center growth critique can ignore Virginia's rapid renewable procurement additions that improve grid carbon intensity even as load rises—load is not automatically 'dirty.'",
      counterDataSource: "PJM interconnection data, Virginia utility renewable expansion reports",
      specificDataPoint: "Virginia solar and wind additions vs. new data center load timing.",
    },
    radarData: [
      { dimension: "Climate Resilience", score: 54, fullMark: 100 },
      { dimension: "Public Health", score: 57, fullMark: 100 },
      { dimension: "Development Quality", score: 60, fullMark: 100 },
      { dimension: "Equity & Access", score: 37, fullMark: 100 },
      { dimension: "Overall Trajectory", score: 52, fullMark: 100 },
    ],
    suggestedQuestions: [
      "Which wards combine highest heat and lowest canopy?",
      "How does Potomac vs. Anacostia flood risk compare for affordable housing stock?",
      "What is the net job-housing balance trend for essential workers?",
    ],
  },
  "greenpoint-brooklyn": {
    entity: ENTITIES[1],
    verdict: "CONTESTED",
    dissentLevel: "HIGH",
    dissentScore: 0.59,
    agents: [
      {
        agentName: "Climate resilience",
        score: 46,
        confidence: 0.77,
        keyFindings: [
          "Newtown Creek superfund legacy and storm surge interaction with industrial waterfront",
          "Heat island along McGuinness corridor with limited street trees vs. McCarren Park cooling",
          "Flood risk from coastal storms and combined sewer overflows during intense rainfall",
        ],
        dataSource: "EPA superfund profiles, NYC DEP climate projections, NOAA surge scenarios",
        reasoning: "Greenpoint's industrial past shapes present climate risk: legacy contamination complicates resilient waterfront design.",
      },
      {
        agentName: "Public health",
        score: 51,
        confidence: 0.74,
        keyFindings: [
          "Truck traffic and goods movement air quality concerns near industrial zones",
          "Access to green space improving but uneven block-to-block",
          "Noise and particulate exposure along major arterials",
        ],
        dataSource: "NYC DOHMH community health profiles, NYSDEC air monitoring",
        reasoning: "Public health reflects a dense mixed industrial-residential interface with ongoing environmental justice scrutiny.",
      },
      {
        agentName: "Urban development",
        score: 58,
        confidence: 0.72,
        keyFindings: [
          "Waterfront rezoning brought new residential towers and retail",
          "Small business displacement pressure along commercial strips",
          "Infrastructure upgrades for sewers and storm lines ongoing but costly",
        ],
        dataSource: "NYC DCP rezoning records, Brooklyn Community Board 1 filings",
        reasoning: "Development is transforming the neighborhood rapidly; benefits and burdens are not evenly shared.",
      },
      {
        agentName: "Equity & housing",
        score: 32,
        confidence: 0.85,
        keyFindings: [
          "Long-term residents face rent pressure from waterfront amenity premium",
          "Legacy environmental burdens concentrated in environmental justice communities",
          "Energy cost burden in older frame housing and walk-ups",
        ],
        dataSource: "Census ACS, local tenant organizing reports, NYC HPD",
        reasoning: "Green gentrification dynamics sit atop industrial legacy risk—climate investment must pair with anti-displacement tools.",
      },
    ],
    devilsAdvocate: {
      targetAgent: "Climate resilience",
      challenge: "Your superfund framing can understate completed remediation milestones and ongoing monitoring that reduce acute exposure pathways compared to the 20th century baseline—risk is real but not frozen in time.",
      counterDataSource: "EPA remedial action reports for Newtown Creek sites",
      specificDataPoint: "Completed cap and containment milestones vs. remaining groundwater treatment needs.",
    },
    radarData: [
      { dimension: "Climate Resilience", score: 46, fullMark: 100 },
      { dimension: "Public Health", score: 51, fullMark: 100 },
      { dimension: "Development Quality", score: 58, fullMark: 100 },
      { dimension: "Equity & Access", score: 32, fullMark: 100 },
      { dimension: "Overall Trajectory", score: 47, fullMark: 100 },
    ],
    suggestedQuestions: [
      "Which blocks combine highest flood risk with legacy contamination?",
      "How are sewer overflow investments prioritized vs. community input?",
      "What tenant protections pair with waterfront resilience projects?",
    ],
  },
  "mission-district-sf": {
    entity: ENTITIES[7],
    verdict: "CONTESTED",
    dissentLevel: "HIGH",
    dissentScore: 0.63,
    agents: [
      {
        agentName: "Climate resilience",
        score: 40,
        confidence: 0.78,
        keyFindings: [
          "Urban heat risk on Mission Street corridor with variable building heights and shade",
          "Wildfire smoke exposure during regional fire seasons",
          "Stormwater and street flooding at low points during intense rainfall",
        ],
        dataSource: "SF climate adaptation plans, air quality monitoring, street flood incident reports",
        reasoning: "The Mission combines dense housing with acute heat and smoke exposure; adaptation is constrained by street width and housing typology.",
      },
      {
        agentName: "Public health",
        score: 49,
        confidence: 0.75,
        keyFindings: [
          "BART and Muni access supports low-car lifestyles for many residents",
          "Traffic-related air pollution along major arterials",
          "COVID-era patterns shifted some commerce; outdoor heat exposure for workers remains",
        ],
        dataSource: "SFMTA mode share, SFDPH community health assessments",
        reasoning: "Public health is relatively strong on mobility access but inequities persist in housing quality and indoor cooling.",
      },
      {
        agentName: "Urban development",
        score: 55,
        confidence: 0.71,
        keyFindings: [
          "Tech-adjacent income pressures and luxury infill alongside legacy rent-controlled stock",
          "Cultural institutions and small business ecosystem under commercial rent stress",
          "State and local housing legislation reshaping fourplex and ADU potential",
        ],
        dataSource: "SF Planning pipeline data, small business surveys, state housing law summaries",
        reasoning: "Development tensions pit preservation, affordability mandates, and rapid market pressure against each other.",
      },
      {
        agentName: "Equity & housing",
        score: 27,
        confidence: 0.87,
        keyFindings: [
          "Displacement pressure on Latino and immigrant communities with long neighborhood tenure",
          "Overcrowding in rent-burdened units",
          "Climate adaptation costs (cooling, filtration) harder for lowest-income households",
        ],
        dataSource: "Census ACS, UC Berkeley displacement research, community organization reports",
        reasoning: "Climate and cultural displacement intersect: sustainability without equity replicates harm.",
      },
    ],
    devilsAdvocate: {
      targetAgent: "Equity & housing",
      challenge: "Your displacement narrative should acknowledge Mission housing nonprofits and community land trusts that secured permanently affordable units—countervailing forces exist even if market pressure dominates headlines.",
      counterDataSource: "Nonprofit housing developer portfolios, MOHCD affordability covenants",
      specificDataPoint: "Count of permanently affordable units created or preserved in the last decade.",
    },
    radarData: [
      { dimension: "Climate Resilience", score: 40, fullMark: 100 },
      { dimension: "Public Health", score: 49, fullMark: 100 },
      { dimension: "Development Quality", score: 55, fullMark: 100 },
      { dimension: "Equity & Access", score: 27, fullMark: 100 },
      { dimension: "Overall Trajectory", score: 43, fullMark: 100 },
    ],
    suggestedQuestions: [
      "Where is indoor heat risk highest for seniors during heat waves?",
      "How does BART access correlate with transportation emissions per household?",
      "Which cultural institutions anchor anti-displacement strategies?",
    ],
  },
  "unilever": {
    entity: ENTITIES[8],
    verdict: "CONTESTED",
    dissentLevel: "MODERATE",
    dissentScore: 0.44,
    agents: [
      {
        agentName: "Energy systems",
        score: 70,
        confidence: 0.78,
        keyFindings: [
          "Factory renewable electricity programs across home care, beauty, and foods manufacturing",
          "Energy efficiency in ice cream cold chain and home care powder plants",
          "Logistics optimization for road and ocean freight emissions intensity",
        ],
        dataSource: "Unilever Sustainability Report, CDP supply chain data",
        reasoning: "Unilever's energy systems span thermal processes and refrigeration. Progress on renewables is meaningful but FMCG throughput remains energy intensive.",
      },
      {
        agentName: "Carbon accounting",
        score: 62,
        confidence: 0.76,
        keyFindings: [
          "Scope 3 dominates due to raw materials, packaging, retailer energy, and consumer use-phase (e.g., hot water for soap)",
          "Science-based targets and interim milestones across brands",
          "Deforestation and land-use risk in palm oil and other agricultural inputs",
        ],
        dataSource: "Unilever Sustainability Report, SBTi, CDP forests questionnaire",
        reasoning: "Carbon accounting is detailed for a consumer goods giant, but agricultural commodities and plastic feedstocks remain contested hotspots.",
      },
      {
        agentName: "Operations",
        score: 59,
        confidence: 0.73,
        keyFindings: [
          "Plastic reduction and refill pilots across personal care and cleaning brands",
          "Water stewardship programs in water-stressed sourcing regions",
          "Supplier human rights and environmental audits on high-risk crops",
        ],
        dataSource: "Unilever Sustainable Living Plan updates, WRI Aqueduct, supplier audit summaries",
        reasoning: "Operational footprint is brand-diverse; packaging and agricultural sourcing dominate lifecycle impacts.",
      },
      {
        agentName: "Regulatory compliance",
        score: 71,
        confidence: 0.79,
        keyFindings: [
          "EU Single-Use Plastics Directive and PPWR alignment workstreams",
          "UK and EU climate disclosure requirements for large enterprises",
          "U.S. state plastic and recycling policy fragmentation affecting packaging design",
        ],
        dataSource: "EU law trackers, UK SECR, U.S. state EPR bills",
        reasoning: "Regulatory complexity is high for multinational FMCG: plastics, chemicals, and climate intersect across markets.",
      },
    ],
    devilsAdvocate: {
      targetAgent: "Carbon accounting",
      challenge: "Your Scope 3 consumer use-phase assumptions for soaps and detergents are sensitive to behavior change that brands do not control. Small shifts in washing temperature or frequency can dominate modeled footprints—making year-to-year comparisons unstable.",
      counterDataSource: "Peer-reviewed LCA of household cleaning products, behavioral studies",
      specificDataPoint: "Sensitivity of modeled footprint to shower/bath temperature assumptions.",
    },
    radarData: [
      { dimension: "Energy Systems", score: 70, fullMark: 100 },
      { dimension: "Carbon Accounting", score: 62, fullMark: 100 },
      { dimension: "Operations", score: 59, fullMark: 100 },
      { dimension: "Regulatory Compliance", score: 71, fullMark: 100 },
      { dimension: "Overall Trajectory", score: 66, fullMark: 100 },
    ],
    suggestedQuestions: [
      "How is palm oil traceability improving vs. deforestation risk?",
      "Which brands have the largest plastic packaging footprint reduction?",
      "What is the marginal abatement cost for cold chain emissions?",
    ],
    noExpansionActions: [
      {
        action: "Scale concentrated refill formats in top European retail partners",
        timeframe: "12 months",
        carbonImpact: "Reduces single-use plastic and downstream waste emissions",
        cost: "Retailer shelf reset and logistics",
      },
      {
        action: "Incentivize lower-temperature washing claims with on-pack QR guidance",
        timeframe: "6 months",
        carbonImpact: "Reduces in-home energy for detergents and fabric care",
        cost: "Marketing and packaging change control",
      },
      {
        action: "Tighten supplier traceability milestones for high-risk agricultural inputs",
        timeframe: "18 months",
        carbonImpact: "Reduces land-use change emissions in Scope 3",
        cost: "Supplier audits and premiums",
      },
    ],
  },
};


// Agent streaming simulation - word-chunked display text
export const generateAgentStream = (agent: AgentOutput): string[] => {
  const fullText = `**${agent.agentName}** (about ${(agent.confidence * 100).toFixed(0)}% sure)

Score: ${agent.score}/100

${agent.reasoning}

**Key Findings:**
${agent.keyFindings.map((f) => `• ${f}`).join("\n")}

**Sources:** ${agent.dataSource}`;

  // Split into word chunks for streaming effect
  const words = fullText.split(" ");
  const chunks: string[] = [];
  let currentChunk = "";

  words.forEach((word, i) => {
    currentChunk += word + " ";
    if (i % 3 === 2 || i === words.length - 1) {
      chunks.push(currentChunk);
      currentChunk = "";
    }
  });

  return chunks;
};

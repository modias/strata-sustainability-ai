export type Mode = "neighborhood" | "corporate";

export type Verdict = "IMPROVING" | "STAGNANT" | "DECLINING" | "CONTESTED";

export type DissentLevel = "LOW" | "MODERATE" | "HIGH";

export interface Entity {
  id: string;
  name: string;
  mode: Mode;
  location?: { lat: number; lng: number };
  address?: string;
}

export interface AgentOutput {
  agentName: string;
  score: number;
  confidence: number;
  keyFindings: string[];
  dataSource: string;
  reasoning: string;
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
    location: { lat: 38.8628, lng: -76.9956 },
    address: "1901 Mississippi Ave SE, Washington, DC 20020",
  },
  {
    id: "greenpoint-brooklyn",
    name: "Greenpoint, Brooklyn NY",
    mode: "neighborhood",
    location: { lat: 40.7297, lng: -73.9504 },
    address: "250 McGuinness Blvd, Brooklyn, NY 11222",
  },
  {
    id: "patagonia",
    name: "Patagonia Inc.",
    mode: "corporate",
  },
  {
    id: "tesla",
    name: "Tesla Inc.",
    mode: "corporate",
  },
  {
    id: "east-austin",
    name: "East Austin, TX",
    mode: "neighborhood",
    location: { lat: 30.2672, lng: -97.7179 },
    address: "1100 E 11th St, Austin, TX 78702",
  },
  {
    id: "amazon",
    name: "Amazon.com Inc.",
    mode: "corporate",
  },
  {
    id: "mission-district-sf",
    name: "Mission District, San Francisco",
    mode: "neighborhood",
    location: { lat: 37.7599, lng: -122.4148 },
    address: "2800 Mission St, San Francisco, CA 94110",
  },
  {
    id: "unilever",
    name: "Unilever PLC",
    mode: "corporate",
  },
  {
    id: "apple",
    name: "Apple Inc.",
    mode: "corporate",
  },
  {
    id: "google",
    name: "Google LLC",
    mode: "corporate",
  },
  {
    id: "nvidia",
    name: "Nvidia Corporation",
    mode: "corporate",
  },
  {
    id: "samsung",
    name: "Samsung Electronics Co., Ltd.",
    mode: "corporate",
  },
  {
    id: "hub-austin-tx",
    name: "Austin, TX",
    mode: "neighborhood",
    location: { lat: 30.2672, lng: -97.7431 },
    address: "Austin, TX metro area",
  },
  {
    id: "hub-boston-ma",
    name: "Boston, MA",
    mode: "neighborhood",
    location: { lat: 42.3601, lng: -71.0589 },
    address: "Boston, MA metro area",
  },
  {
    id: "hub-nyc-ny",
    name: "New York City, NY",
    mode: "neighborhood",
    location: { lat: 40.7128, lng: -74.006 },
    address: "New York City, NY metro area",
  },
  {
    id: "hub-sf-bay-ca",
    name: "San Francisco Bay, CA",
    mode: "neighborhood",
    location: { lat: 37.7749, lng: -122.4194 },
    address: "San Francisco Bay Area, CA",
  },
  {
    id: "hub-seattle-wa",
    name: "Seattle, WA",
    mode: "neighborhood",
    location: { lat: 47.6062, lng: -122.3321 },
    address: "Seattle, WA metro area",
  },
  {
    id: "hub-washington-dc",
    name: "Washington, DC",
    mode: "neighborhood",
    location: { lat: 38.9072, lng: -77.0369 },
    address: "Washington, DC metro area",
  },
];

/** Route `entityId` → Snowflake `entity_id` for `/history` and CV rows */
export const SNOWFLAKE_ENTITY_ID: Partial<Record<string, string>> = {
  "anacostia-dc": "anacostia",
  "east-austin": "phoenix_south",
  "mission-district-sf": "detroit_midtown",
  patagonia: "target",
  amazon: "chipotle",
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
};

function cloneAnalysisFromTemplate(templateId: string, targetIds: readonly string[]) {
  const template = MOCK_RESULTS[templateId];
  if (!template) return;
  for (const id of targetIds) {
    const entity = ENTITIES.find((e) => e.id === id);
    if (entity) MOCK_RESULTS[id] = { ...template, entity };
  }
}

cloneAnalysisFromTemplate("tesla", ["amazon", "apple", "google", "nvidia", "samsung"]);
cloneAnalysisFromTemplate("east-austin", [
  "hub-austin-tx",
  "hub-boston-ma",
  "hub-nyc-ny",
  "hub-sf-bay-ca",
  "hub-seattle-wa",
  "hub-washington-dc",
]);

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

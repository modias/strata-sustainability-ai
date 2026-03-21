# 🌍 STRATA — Sustainability Intelligence Platform

### *Five AI agents debate each other in real time so you know whether a neighborhood or company is genuinely improving — or just performing sustainability.*

[![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-AI-4285F4?style=flat-square&logo=google)](https://aistudio.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## The Problem

Every sustainability score tells you where something stands today. None of them tell you which direction it's heading — and none of them tell you how much to trust the number.

A neighborhood can score green on every index while rent doubles and long-term residents are displaced. A company can publish a net-zero pledge while its Scope 3 emissions are increasing. Existing tools grade the present state. **STRATA grades the trajectory** — and when its agents disagree, it tells you that too.

---

## What STRATA Does

STRATA is a **dual-mode AI intelligence platform**. Enter a neighborhood address or a company name. Five specialized agents powered by **Gemini 2.5 Flash** simultaneously analyze the entity, debate each other's findings in real time, and produce three outputs:

| Output | What It Is |
|---|---|
| **Trajectory Verdict** | `IMPROVING` / `STAGNANT` / `DECLINING` / `CONTESTED` |
| **Live Scoring Radar** | Per-dimension scores updating token by token as agents stream |
| **Dissent Map** | Exactly where agents disagreed, why, and which data point triggered it |

> `CONTESTED` is the most important verdict in the system. It means agents disagree sharply — and that disagreement is itself actionable information no rating agency produces.

---

## Key Features

- **Multi-agent debate architecture** — five agents fire in parallel via `asyncio.gather()`, each reasoning through their own lens on the same data profile
- **Real-time streaming** — results stream token-by-token to the browser over SSE; the radar chart updates live as each agent finishes
- **Devil's Advocate (Round 2)** — after Round 1 completes, a fifth agent reads all four outputs and challenges the highest-confidence claim with a specific, sourced counter-argument
- **Green gentrification detection** — the Equity Analyst cross-references every sustainability improvement signal against Census rent trajectory, flagging when improvements displace the residents they're supposed to help
- **No-expansion action list** — corporate mode produces a ranked list of carbon improvements achievable with zero new capex, no new headcount, and no facility changes, each tagged with a 90-day / 6-month / 12-month timeframe
- **Runs entirely on free APIs** — satellite imagery, street-level photos, air quality, demographics, emissions data — all free. The only spend is the Gemini API key (free tier covers demo and early production)

---

## Modes

### 🏙️ Neighborhood Mode
*For city planners, residents, and real estate analysts*

> Is this area becoming more livable — or just more expensive?

| Agent | Lens |
|---|---|
| **Climate Resilience** | Heat island trajectory, NDVI, green coverage, flood risk from Sentinel-2 thermal data |
| **Public Health** | Walkability, air quality, park access within 0.5 mi, street-level tree canopy via Gemini Vision on Mapillary images |
| **Urban Development** | Construction activity via OpenCV temporal satellite comparison, permit trends, infrastructure investment signals |
| **Equity Analyst** | Every improvement signal cross-referenced against Census ACS income and rent — flags green gentrification |
| **Devil's Advocate** | Challenges the highest-confidence agent with a named counter-source (e.g., WRI Aqueduct water stress data) |

### 🏢 Corporate Mode
*For sustainability managers and ESG analysts*

> What can we improve without restructuring the business?

| Agent | Lens |
|---|---|
| **Energy Systems** | Energy intensity vs. EPA ENERGY STAR benchmarks, renewable progress, efficiency trajectory |
| **Carbon Accounting** | Scope 1/2/3 vs. SBTi targets and CDP disclosures, supplier engagement gaps |
| **Operations** | Waste diversion, water intensity, logistics carbon — generates the no-expansion action list |
| **Regulatory Compliance** | SEC climate disclosure, EU CSRD, California SB 253, litigation posture toward incoming rules |
| **Devil's Advocate** | Same mandate — always targets the most confident claim, always requires a cited data source |

---

## The Three Output Primitives

### 1. Trajectory Verdict
| Verdict | Signal |
|---|---|
| `IMPROVING` | Agents converge on positive direction |
| `STAGNANT` | No meaningful directional signal |
| `DECLINING` | Agents converge on negative direction |
| `CONTESTED` | Agents disagree sharply — the disagreement *is* the signal |

### 2. Dissent Score
Computed as the weighted average of confidence gaps across all Devil's Advocate challenges, weighted by dimension significance.

- **High dissent** → verdict is fragile; rests on contested assumptions
- **Low dissent** → committee converged; verdict is robust

Rating agencies give you a number. STRATA tells you **how much to trust the number**.

### 3. No-Expansion Action List *(Corporate only)*
Filtered by: no capex > $50k · no new headcount · no facility changes.
Ranked by carbon impact per dollar. Tagged: `90 days` · `6 months` · `12 months`.

---

## How It Works (Core Loop)

```
User Input (address or company name)
        │
        ▼
  Geocode → Nominatim       Fetch satellite → Sentinel-2
  Street photos → Mapillary  Demographics → Census ACS
        │
        ▼
  OpenCV (local, zero API cost)
  ├── NDVI vegetation index
  ├── Green coverage %
  ├── Impervious surface %
  ├── Fragmentation score
  └── Construction activity (temporal comparison)
        │
        ▼
  5 Agent Profiles → SQLite
        │
        ▼
  asyncio.gather() — 4 agents fire in parallel
  Results stream via SSE → frontend radar updates live
        │
        ▼
  Round 2: Devil's Advocate reads all 4 outputs
  Challenges highest-confidence claim with cited source
        │
        ▼
  Trajectory Verdict · Dissent Score · Action List
```

---

## Sample Output

**Neighborhood query:** `Williamsburg, Brooklyn, NY`

```
TRAJECTORY VERDICT:  CONTESTED

Climate Resilience  ████████░░  0.74  ↑ improving
Public Health       ██████░░░░  0.61  ↑ improving
Urban Development   ████░░░░░░  0.43  → stagnant
Equity Analyst      ██░░░░░░░░  0.22  ↓ declining

DISSENT SCORE: 0.81 (HIGH) — verdict is fragile

Devil's Advocate → [Climate Resilience, 0.74]
  "NDVI shows +12% canopy gain since 2019. However, WRI Aqueduct
   projects a 34% increase in water stress for this watershed by
   2030. Green coverage growing under increasing drought pressure
   is not a durable improvement signal."

NO-EXPANSION ACTIONS (Corporate mode):
  [90 days]  Switch to 100% renewable electricity tariff — 0 capex
  [6 months] Reroute 3 freight lanes to rail — $12k, saves 340 tCO₂/yr
  [12 months] LED retrofit remaining 2 facilities — $38k, saves 180 tCO₂/yr
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **AI / Agents** | Google Gemini 2.5 Flash (reasoning + vision) |
| **Backend** | FastAPI · Python 3.11 · asyncio · SSE |
| **Computer Vision** | OpenCV · NumPy · rasterio · Pillow |
| **Database** | SQLite (agent profiles) · Redis 7 (rate limiting + cache) |
| **Frontend** | Leaflet.js (maps) · Chart.js (radar) · html2canvas (export) |
| **Deployment** | Railway (backend) · Vercel (frontend) |
| **Auth** | Auth0 (JWT) |

---

## Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker (for Redis)
- A [Google AI Studio](https://aistudio.google.com) API key (free tier)

### 1. Clone the repo
```bash
git clone https://github.com/your-org/strata-sustainability-ai.git
cd strata-sustainability-ai
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Open `.env` and fill in:
```env
GEMINI_API_KEY=your_key_here
MAPILLARY_TOKEN=your_token_here
NOAA_TOKEN=your_token_here      # optional
OPENAQ_KEY=your_key_here        # optional
```

### 3. Start Redis
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### 4. Install and run the backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 5. Install and run the frontend
```bash
cd frontend
npm install
npm run dev
```

### 6. Open the app
Navigate to [http://localhost:3000](http://localhost:3000)

---

## Data Sources

<details>
<summary><strong>Satellite & Imagery</strong></summary>

| Source | Data | Cost |
|---|---|---|
| [Sentinel-2 / Copernicus](https://copernicus.eu/en/data-access) | 10m multispectral tiles, NDVI, thermal bands | Free, no key |
| [NASA Earthdata / Landsat](https://earthdata.nasa.gov) | 30m imagery, historical back to 1972 | Free account |
| [ESRI World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery) | Satellite base tiles for Leaflet | Free, no key |
| [Mapillary API](https://mapillary.com/developer) | Street-level photos for vision analysis | Free token |
| [OpenStreetMap Tiles](https://tile.openstreetmap.org) | Street map base layer | Free, no key |

</details>

<details>
<summary><strong>Neighborhood & Environmental</strong></summary>

| Source | Data | Cost |
|---|---|---|
| [Census ACS API](https://api.census.gov/data/2022/acs/acs5) | Median income, rent burden, demographics by census tract | Free, no key |
| [FCC Block API](https://geo.fcc.gov/api/census/block/find) | Lat/lng → census tract FIPS conversion | Free, no key |
| [NOAA Climate Data Online](https://ncdc.noaa.gov/cdo-web/token) | Urban heat, extreme heat days/year | Free token |
| [OpenAQ API](https://api.openaq.org) | Real-time PM2.5/AQI from 30,000+ global stations | Free key |
| [EPA EnviroAtlas](https://enviroatlas.epa.gov) | Green space coverage, walkability index by census tract | Free, no key |
| [EPA AirNow](https://aqs.epa.gov) | Air quality index (backup source) | Free, no key |
| [Overpass API](https://overpass-api.de) | Parks, transit, bike lanes, tree inventory from OSM | Free, no key |
| [Nominatim](https://nominatim.openstreetmap.org) | Address → lat/lng geocoding globally | Free, no key |

</details>

<details>
<summary><strong>Corporate Sustainability</strong></summary>

| Source | Data | Cost |
|---|---|---|
| [CDP Open Data](https://data.cdp.net) | Scope 1/2/3 disclosures for 18,000+ companies | Free, no key |
| [EPA GHGRP](https://ghgdata.epa.gov) | Facility-level Scope 1 emissions | Free, no key |
| [SEC EDGAR Full-Text API](https://efts.sec.gov) | 10-K filings, climate risk sections | Free, no key |
| [EPA ENERGY STAR](https://energystar.gov/benchmark) | Energy intensity benchmarks by sector | Free, no key |
| [SBTi Target Registry](https://sciencebasedtargets.org/companies-taking-action) | Science-Based Targets status per company | Free, no key |
| [EPA SmartWay](https://epa.gov/smartway) | Logistics and freight emissions benchmarks | Free, no key |

</details>

<details>
<summary><strong>Computer Vision — All Local, Zero API Cost</strong></summary>

| Library | Purpose |
|---|---|
| [`opencv-python-headless`](https://pypi.org/project/opencv-python-headless) | NDVI, green coverage %, impervious surface %, fragmentation, construction detection, temporal change |
| [`numpy`](https://numpy.org) | Satellite band arithmetic |
| [`rasterio`](https://rasterio.readthedocs.io) | Reads Sentinel-2 GeoTIFF format |
| [`Pillow`](https://python-pillow.org) | Image format conversion before Gemini Vision |

</details>

---

## Team

| Name | Role |
|---|---|
| *Your Name* | Full-stack · AI agent architecture |
| *Teammate* | Data pipeline · Computer vision |
| *Teammate* | Frontend · UX |

*Built at [Hackathon Name] · [Date]*

---

## Acknowledgments

- [Google AI Studio](https://aistudio.google.com) — Gemini 2.5 Flash API
- [EU Copernicus Programme](https://copernicus.eu) — free satellite imagery
- [OpenStreetMap contributors](https://openstreetmap.org) — Nominatim geocoding and Overpass API
- [Meta Open Source](https://mapillary.com) — Mapillary street-level imagery
- [US Census Bureau](https://census.gov) — ACS demographic data
- Auth0 · GoDaddy — sponsor prizes

---

<div align="center">

**STRATA doesn't score sustainability. It scores the direction.**

*And when it's not sure — it tells you that too.*

</div>

import { Link } from "react-router";
import { Layers, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { cn } from "../components/ui/utils";

const steps = [
  {
    n: 1,
    title: "INPUT",
    body: "Enter any neighborhood address or company name",
  },
  {
    n: 2,
    title: "DATA COLLECTION",
    body: "Satellite imagery (Sentinel-2), Census ACS demographics, EPA air quality, CDP emissions data — all public, all free",
  },
  {
    n: 3,
    title: "PARALLEL ANALYSIS",
    body: "4 specialized AI agents fire simultaneously via asyncio.gather() — Environmental, Social, Risk, Momentum",
  },
  {
    n: 4,
    title: "ADVERSARIAL DEBATE",
    body: "Agents stream results live as they finish. The committee debates. The highest-confidence claim gets challenged.",
  },
  {
    n: 5,
    title: "VERDICT + DISSENT SCORE",
    body: "IMPROVING / STAGNANT / DECLINING / CONTESTED — plus a dissent score that tells you how much to trust the verdict",
  },
];

const agents = [
  {
    name: "Environmental Agent",
    color: "emerald",
    className: "border-emerald-500/40 bg-emerald-500/5",
    titleClass: "text-emerald-400",
    body: "Scores heat vulnerability, green coverage, NDVI vegetation index, and flood risk from satellite data. Flags neighborhoods where heat islands are worsening despite green investment announcements.",
  },
  {
    name: "Social Agent",
    color: "teal",
    className: "border-teal-500/40 bg-teal-500/5",
    titleClass: "text-teal-400",
    body: "Cross-references every improvement signal against Census ACS income and rent trajectory. Flags green gentrification — when sustainability investment drives displacement.",
  },
  {
    name: "Risk Agent",
    color: "amber",
    className: "border-amber-500/40 bg-amber-500/5",
    titleClass: "text-amber-400",
    body: "Evaluates regulatory exposure (SEC Climate Rule, California SB 253), physical climate vulnerability, stranded asset risk, and supply chain fragility across 7 dimensions.",
  },
  {
    name: "Momentum Agent",
    color: "blue",
    className: "border-blue-500/40 bg-blue-500/5",
    titleClass: "text-blue-400",
    body: "Ignores current state entirely. Evaluates only direction and speed of change. Is this entity accelerating toward sustainability, stagnating, or reversing?",
  },
];

const techRows = [
  ["AI Layer", "Google Gemini 2.5 Flash with Search Grounding"],
  ["Backend", "FastAPI + asyncio + SSE streaming"],
  ["Database", "Snowflake (VARIANT columns for agent JSON)"],
  ["Cache", "Redis (3-tier rate limiting + response cache)"],
  ["CV Pipeline", "OpenCV + rasterio (local, zero API cost)"],
  ["Satellite", "Sentinel-2 / Copernicus (free, 10m resolution)"],
  ["Street Imagery", "Mapillary (free, Meta open project)"],
  ["Demographics", "Census ACS API (free, no key required)"],
  ["Emissions", "CDP Open Data + EPA GHGRP (free)"],
  ["Maps", "Leaflet + ESRI World Imagery (free, no billing)"],
  ["Auth", "Auth0 (JWT, saved analyses)"],
  ["Deploy", "Railway (backend) + Vercel (frontend)"],
];

const competitiveRows = [
  [
    "Google Environmental Insights",
    "Scores green space today",
    "No trajectory, no equity layer",
  ],
  ["EPA EnviroAtlas", "Static environmental data", "No AI reasoning, no future signal"],
  ["MSCI ESG Ratings", "Single perspective score", "No adversarial debate, no dissent score"],
  ["Sustainalytics", "Corporate ESG scores", "No neighborhood mode, no displacement flag"],
  ["Bloomberg ESG", "Data aggregation", "No verdict, no actionable recommendations"],
];

export function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm hidden sm:inline">Home</span>
              </Link>
              <div className="h-8 w-px bg-slate-700 hidden sm:block" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white font-mono tracking-tight">STRATA</div>
                  <p className="text-xs text-slate-400 hidden sm:block">About</p>
                </div>
              </div>
            </div>
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to app
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        {/* SECTION 1 — Hero */}
        <section className="text-center mb-20 md:mb-24">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold font-mono text-emerald-400 mb-4 tracking-tight">
            STRATA
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 font-medium mb-2">
            Sustainability Intelligence Platform
          </p>
          <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The first AI committee that debates sustainability — not just scores it.
          </p>
        </section>

        {/* SECTION 2 — The Problem */}
        <section className="mb-20 md:mb-24">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">The Problem</h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              Cities are spending hundreds of billions on climate resilience. Every existing tool — Google, EPA,
              Bloomberg — tells you where green space is today. None of them tell you whether the neighborhood is
              becoming more livable, or just more expensive.
            </p>
            <p>
              A neighborhood can score 8/10 on green coverage while simultaneously displacing every resident who
              originally lived there. A company can claim net-zero by 2040 while its top 20 suppliers account for 67%
              of actual emissions with no verified targets.
            </p>
            <p>
              The tools that measure sustainability tell you what exists today. Not what is happening next. And none of
              them tell you who benefits.
            </p>
          </div>
          <div
            className={cn(
              "mt-8 rounded-lg border border-emerald-500/50 bg-emerald-500/5",
              "px-5 py-4 text-slate-200 leading-relaxed"
            )}
          >
            <p>
              In 2023, Washington DC spent $47 million planting trees in Anacostia. Rents rose 34% in 18 months. STRATA
              would have flagged this before the money was spent.
            </p>
          </div>
        </section>

        {/* SECTION 3 — How It Works */}
        <section className="mb-20 md:mb-24">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-10">How It Works</h2>
          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={step.n} className="flex gap-4 md:gap-6">
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      "border-2 border-emerald-500/60 bg-emerald-500/10",
                      "font-mono font-bold text-emerald-400 text-sm"
                    )}
                  >
                    {step.n}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 min-h-[2rem] bg-gradient-to-b from-emerald-500/40 to-transparent mt-2" />
                  )}
                </div>
                <div className="pt-1 pb-2">
                  <h3 className="font-mono text-sm font-semibold text-emerald-400/90 tracking-wide mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-sm md:text-base">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4 — The Four Agents */}
        <section className="mb-20 md:mb-24">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">The Committee</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((a) => (
              <Card key={a.name} className={cn("border", a.className, "bg-slate-900/40")}>
                <CardHeader className="pb-2">
                  <CardTitle className={cn("text-lg", a.titleClass)}>{a.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 text-sm leading-relaxed">{a.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* SECTION 5 — Novel Outputs */}
        <section className="mb-20 md:mb-24">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">What Makes STRATA Different</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-5">
              <h3 className="font-semibold text-emerald-400 mb-3">Trajectory Verdict</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                IMPROVING, STAGNANT, DECLINING, or CONTESTED. We score direction — not a snapshot. CONTESTED is the most
                important signal: it means the data is genuinely ambiguous.
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-5">
              <h3 className="font-semibold text-emerald-400 mb-3">Dissent Score</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Quantifies how much agents disagreed. High dissent = fragile verdict. Low dissent = robust consensus. No
                existing ESG tool produces this output. Rating agencies give you a number. STRATA tells you how much to
                trust the number.
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-5">
              <h3 className="font-semibold text-emerald-400 mb-3">No-Expansion Actions</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                For corporate mode: improvements achievable with zero new capital expenditure, no new headcount, no
                facility changes. Ranked by carbon impact per dollar. Most sustainability consultants charge $200k for
                this list.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6 — Tech Stack */}
        <section className="mb-20 md:mb-24">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Technical Architecture</h2>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-emerald-400 font-mono text-xs uppercase tracking-wider w-[40%]">
                  Layer
                </TableHead>
                <TableHead className="text-slate-300">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {techRows.map(([layer, detail]) => (
                <TableRow key={layer} className="border-slate-800">
                  <TableCell className="font-medium text-slate-200 align-top py-3">{layer}</TableCell>
                  <TableCell className="text-slate-400 text-sm align-top py-3">{detail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-6 text-sm text-slate-500 leading-relaxed">
            Every data source is public and free. The only paid service is the Gemini API key.
          </p>
        </section>

        {/* SECTION 7 — Competitive Landscape */}
        <section className="mb-20 md:mb-24">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Why Not Just Use...</h2>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-emerald-400 text-xs uppercase tracking-wider">Tool</TableHead>
                <TableHead className="text-slate-400 text-xs uppercase tracking-wider">What it does</TableHead>
                <TableHead className="text-slate-400 text-xs uppercase tracking-wider">What it misses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitiveRows.map(([tool, does, misses]) => (
                <TableRow key={tool} className="border-slate-800">
                  <TableCell className="font-medium text-slate-200 align-top py-3 text-sm">{tool}</TableCell>
                  <TableCell className="text-slate-400 text-sm align-top py-3">{does}</TableCell>
                  <TableCell className="text-slate-400 text-sm align-top py-3">{misses}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-8 text-slate-300 leading-relaxed">
            STRATA is the only tool that runs an adversarial multi-agent debate and produces a dissent score.
          </p>
        </section>

        {/* SECTION 8 — Team */}
        <section className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Built at HooHacks 2026</h2>
          <p className="text-slate-400 mb-6">University of Virginia · 24 hours</p>
          <p className="text-slate-300 leading-relaxed mb-8">
            A team of full-stack engineers building sustainability intelligence that actually tells the truth.
          </p>
          <p className="text-slate-400 text-sm">
            <a
              href="https://strata.city"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-mono transition-colors"
            >
              strata.city
            </a>
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-slate-500">
            <Link to="/" className="text-emerald-500/80 hover:text-emerald-400 transition-colors">
              Home
            </Link>
            <span className="mx-2 text-slate-600">·</span>
            <a href="https://strata.city" className="text-slate-500 hover:text-slate-400" target="_blank" rel="noreferrer">
              strata.city
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default About;

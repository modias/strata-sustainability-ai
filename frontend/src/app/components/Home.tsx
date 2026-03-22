import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ENTITIES, type Entity } from "../data/mockData";

const FEATURED_IDS = ["amazon", "apple", "google", "nvidia", "samsung", "tesla"] as const;

const HUB_IDS = [
  "hub-austin-tx",
  "hub-boston-ma",
  "hub-new-york-ny",
  "hub-san-francisco-ca",
  "hub-seattle-wa",
  "hub-washington-dc",
] as const;

function entitiesByIds(ids: readonly string[]): Entity[] {
  return ids
    .map((id) => ENTITIES.find((e) => e.id === id))
    .filter((e): e is Entity => e != null)
    .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

const QUICK_PICKS = [
  { label: "Anacostia, DC", href: "/analysis/neighborhood/anacostia-dc" },
  { label: "Tesla", href: "/analysis/corporate/tesla" },
  { label: "Detroit Midtown", href: "/analysis/neighborhood/detroit-midtown" },
  { label: "Amazon", href: "/analysis/corporate/amazon" },
  { label: "Phoenix South", href: "/analysis/neighborhood/phoenix-south" },
  { label: "Apple", href: "/analysis/corporate/apple" },
] as const;

export function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return;
    if (q.includes("anacostia") || q.includes("dc")) navigate("/analysis/neighborhood/anacostia-dc");
    else if (q.includes("detroit")) navigate("/analysis/neighborhood/detroit-midtown");
    else if (q.includes("phoenix")) navigate("/analysis/neighborhood/phoenix-south");
    else if (q.includes("tesla")) navigate("/analysis/corporate/tesla");
    else if (q.includes("amazon")) navigate("/analysis/corporate/amazon");
    else if (q.includes("apple")) navigate("/analysis/corporate/apple");
    else if (q.includes("microsoft")) navigate("/analysis/corporate/microsoft");
    else if (q.includes("google")) navigate("/analysis/corporate/google");
    else if (q.includes("austin")) navigate("/analysis/neighborhood/hub-austin-tx");
    else navigate("/analysis/neighborhood/anacostia-dc");
  };

  const featuredEntities = entitiesByIds(FEATURED_IDS);
  const hubEntities = entitiesByIds(HUB_IDS);

  return (
    <div className="min-h-screen bg-[#050810] text-white">
      <div className="min-h-screen flex flex-col">
        <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 text-xs font-mono font-bold">
              S
            </div>
            <span className="font-mono font-bold tracking-widest text-white">STRATA</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/about" className="text-sm text-white/40 hover:text-white transition-colors">
              About
            </Link>
            <Link
              to="/about"
              className="text-xs font-mono px-4 py-2 rounded-full border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 transition-colors"
            >
              HooHacks 2026
            </Link>
          </div>
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center max-w-4xl mx-auto w-full pb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/5 text-emerald-400 text-xs font-mono mb-8 tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE AI COMMITTEE
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
            Sustainability
            <br />
            <span className="text-emerald-400">Needs a Debate</span>
            <br />
            Not a Score
          </h1>

          <p className="text-lg text-white/50 mb-12 max-w-2xl leading-relaxed">
            Four AI specialists analyze neighborhoods and companies simultaneously — then argue about what they found.
            You see every disagreement, in real time.
          </p>

          <div className="w-full max-w-2xl mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Try: Anacostia DC · Tesla · Austin TX hub..."
                className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/20 outline-none focus:border-emerald-400/40 transition-colors text-sm"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="px-6 py-4 bg-emerald-400 text-black font-mono font-bold text-sm rounded-xl hover:bg-emerald-300 transition-colors whitespace-nowrap"
              >
                Analyze →
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-16">
            {QUICK_PICKS.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="px-4 py-2 rounded-full border border-white/10 text-white/40 text-xs hover:border-emerald-400/30 hover:text-emerald-400 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6 sm:gap-8 w-full max-w-2xl border-t border-white/5 pt-10">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 font-mono mb-1">4</div>
              <div className="text-xs text-white/30 uppercase tracking-widest">AI Specialists</div>
            </div>
            <div className="text-center border-x border-white/5">
              <div className="text-3xl font-bold text-emerald-400 font-mono mb-1">22</div>
              <div className="text-xs text-white/30 uppercase tracking-widest">Free Data Sources</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 font-mono mb-1">1</div>
              <div className="text-xs text-white/30 uppercase tracking-widest">Dissent Score</div>
            </div>
          </div>
        </div>
      </div>

      <section className="border-t border-white/5 px-8 py-16 max-w-6xl mx-auto w-full">
        <h2 className="text-white/30 font-mono text-xs uppercase tracking-widest mb-4">Featured Companies</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {featuredEntities.map((entity) => (
            <Link
              key={entity.id}
              to={`/analysis/corporate/${entity.id}`}
              className="block bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 hover:border-emerald-400/20 hover:bg-white/[0.05] transition-all text-left"
            >
              <div className="text-white font-semibold text-lg mb-1">{entity.name}</div>
              <span className="text-emerald-400 text-sm font-mono">Analyze →</span>
            </Link>
          ))}
        </div>

        <h2 className="text-white/30 font-mono text-xs uppercase tracking-widest mb-4">Corporate Hubs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hubEntities.map((entity) => (
            <Link
              key={entity.id}
              to={`/analysis/neighborhood/${entity.id}`}
              className="block bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 hover:border-emerald-400/20 hover:bg-white/[0.05] transition-all text-left"
            >
              <div className="text-white font-semibold text-lg mb-1">{entity.name}</div>
              <span className="text-emerald-400 text-sm font-mono">View Hub →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

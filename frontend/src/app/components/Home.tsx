import { Link } from "react-router";

export function Home() {
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
          <Link to="/about" className="text-sm text-white/40 hover:text-white transition-colors">
            About
          </Link>
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

          <div className="flex gap-4 justify-center mt-8 mb-16 flex-wrap">
            <Link
              to="/companies"
              className="group flex flex-col items-center gap-3 px-12 py-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 hover:bg-emerald-400/10 hover:border-emerald-400/40 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-400/20 flex items-center justify-center text-2xl">
                🏢
              </div>
              <div>
                <div className="text-white font-semibold text-lg text-center">Company</div>
                <div className="text-white/40 text-sm text-center mt-1">Analyze corporate sustainability</div>
              </div>
              <div className="text-emerald-400 text-sm font-mono group-hover:translate-x-1 transition-transform">
                Explore →
              </div>
            </Link>

            <Link
              to="/corporate-hubs"
              className="group flex flex-col items-center gap-3 px-12 py-8 rounded-2xl border border-white/10 bg-white/3 hover:bg-white/5 hover:border-white/20 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                🌆
              </div>
              <div>
                <div className="text-white font-semibold text-lg text-center">Corporate Hub</div>
                <div className="text-white/40 text-sm text-center mt-1">Analyze city sustainability</div>
              </div>
              <div className="text-white/40 text-sm font-mono group-hover:translate-x-1 transition-transform">
                Explore →
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

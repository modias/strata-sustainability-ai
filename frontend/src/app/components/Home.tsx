import * as React from "react";
import { Link } from "react-router";
import { Layers, Building2, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Mode } from "../data/mockData";

export function Home() {
  const [selectedMode, setSelectedMode] = React.useState<Mode>("neighborhood");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">STRATA</h1>
                <p className="text-xs text-slate-400 hidden sm:block">Sustainability Intelligence Platform</p>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 hidden md:flex">
              <Sparkles className="h-3 w-3 mr-1" />
              Powered by advanced AI
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16 flex-1">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Five expert views • Live debate • Disagreement mapped
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Sustainability Analysis
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Powered by AI Debate
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-slate-300 mb-8">
            Five specialists look at neighborhoods and companies from different angles, debate what they see in real
            time, and deliver a direction verdict—plus a clear read on where they disagree.
          </p>

          <div className="flex gap-4 justify-center mb-8">
            <Button
              size="lg"
              variant={selectedMode === "neighborhood" ? "default" : "outline"}
              asChild
              className={
                selectedMode === "neighborhood"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800"
              }
            >
              <Link to="/companies" onClick={() => setSelectedMode("neighborhood")}>
                <Layers className="h-5 w-5 mr-2" />
                <span>Company</span>
              </Link>
            </Button>
            <Button
              size="lg"
              variant={selectedMode === "corporate" ? "default" : "outline"}
              asChild
              className={
                selectedMode === "corporate"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800"
              }
            >
              <Link to="/corporate-hubs" onClick={() => setSelectedMode("corporate")}>
                <Building2 className="h-5 w-5 mr-2" />
                <span>Corporate Hub</span>
              </Link>
            </Button>
          </div>

          <div className="max-w-3xl mx-auto mb-12">
            <Card className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-white text-xl text-center">The Problem</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 leading-relaxed text-center">
                  In 2023, Washington DC spent <strong className="text-amber-400">$47 million</strong> planting trees in
                  Anacostia. Rents in that neighborhood rose{" "}
                  <strong className="text-amber-400">34% in 18 months</strong>. The sustainability investment worked.
                  The residents it was meant to help couldn't afford to stay. Every existing tool would have scored
                  that neighborhood as improving.{" "}
                  <strong className="text-white">
                    STRATA would have flagged it as CONTESTED before the money was spent.
                  </strong>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-800 bg-slate-950/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-slate-500">Built on public data and AI-assisted analysis</p>
        </div>
      </footer>
    </div>
  );
}

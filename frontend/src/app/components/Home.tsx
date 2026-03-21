import { useState } from "react";
import { useNavigate } from "react-router";
import { Layers, Building2, Search, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ENTITIES, Mode } from "../data/mockData";
import { UserPersonas } from "./UserPersonas";

export function Home() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<Mode>("neighborhood");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntities = ENTITIES.filter(
    (e) => e.mode === selectedMode && e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEntitySelect = (entityId: string) => {
    navigate(`/analysis/${selectedMode}/${entityId}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
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
              Powered by Gemini 2.5 Flash
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 flex-1">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Five AI Agents • Real-time Debate • Dissent Mapping
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Sustainability Analysis
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Powered by AI Debate
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-slate-300 mb-8">
            Five specialized AI agents simultaneously analyze neighborhoods and corporations from different
            perspectives, debate their findings in real time, and produce a trajectory verdict with dissent mapping.
          </p>

          {/* Mode Selection */}
          <div className="flex gap-4 justify-center mb-8">
            <Button
              size="lg"
              variant={selectedMode === "neighborhood" ? "default" : "outline"}
              onClick={() => setSelectedMode("neighborhood")}
              className={
                selectedMode === "neighborhood"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800"
              }
            >
              <Layers className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Neighborhood Mode</span>
              <span className="sm:hidden">Neighborhood</span>
            </Button>
            <Button
              size="lg"
              variant={selectedMode === "corporate" ? "default" : "outline"}
              onClick={() => setSelectedMode("corporate")}
              className={
                selectedMode === "corporate"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800"
              }
            >
              <Building2 className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Corporate Mode</span>
              <span className="sm:hidden">Corporate</span>
            </Button>
          </div>

          {/* Search */}
          <div className="max-w-xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder={
                  selectedMode === "neighborhood" ? "Search neighborhoods..." : "Search companies..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Problem Statement */}
          <div className="max-w-3xl mx-auto mb-12">
            <Card className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-white text-xl text-center">The Problem</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 leading-relaxed text-center">
                  In 2023, Washington DC spent <strong className="text-amber-400">$47 million</strong> planting trees
                  in Anacostia. Rents in that neighborhood rose{" "}
                  <strong className="text-amber-400">34% in 18 months</strong>. The sustainability investment worked.
                  The residents it was meant to help couldn't afford to stay. Every existing tool would have scored
                  that neighborhood as improving. <strong className="text-white">STRATA would have flagged it as CONTESTED before the money was spent.</strong>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pre-cached Entities */}
        <div className="max-w-5xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-4">
            {selectedMode === "neighborhood" ? "Featured Neighborhoods" : "Featured Companies"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntities.map((entity) => (
              <Card
                key={entity.id}
                className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group"
                onClick={() => handleEntitySelect(entity.id)}
              >
                <CardHeader>
                  <CardTitle className="text-white group-hover:text-emerald-400 transition-colors">
                    {entity.name}
                  </CardTitle>
                  {entity.address && (
                    <CardDescription className="text-slate-400 text-sm">{entity.address}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Button
                    variant="ghost"
                    className="w-full text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                  >
                    Analyze →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Value Proposition */}
        <div className="max-w-5xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900/30 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Trajectory Verdict</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">
                Unlike tools that score the present state, STRATA scores <strong>direction</strong>: IMPROVING,
                STAGNANT, DECLINING, or CONTESTED.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/30 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Dissent Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">
                Quantifies agent disagreement. High dissent means the verdict is fragile—the analysis rests on
                contested assumptions.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/30 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Equity Layer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">
                Cross-references every improvement against who lives there and what happens to them. Sustainable{" "}
                <em>for whom?</em>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Personas */}
        <UserPersonas />
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-slate-500">
            Built with React, FastAPI, Gemini 2.5 Flash, and free public data sources
          </p>
        </div>
      </footer>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Download, MapPin, Building2, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { AgentCard } from "./AgentCard";
import { VerdictCard } from "./VerdictCard";
import { RadarChart } from "./RadarChart";
import { DissentMap } from "./DissentMap";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { NoExpansionActions } from "./NoExpansionActions";
import { MapView } from "./MapView";
import { MOCK_RESULTS, AgentOutput, generateAgentStream } from "../data/mockData";
import html2canvas from "html2canvas";

type AnalysisPhase = "idle" | "streaming" | "complete";

export function AnalysisView() {
  const { mode, entityId } = useParams<{ mode: string; entityId: string }>();
  const navigate = useNavigate();
  const verdictCardRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [streamingAgentIndex, setStreamingAgentIndex] = useState(-1);
  const [agentOutputs, setAgentOutputs] = useState<AgentOutput[]>([]);
  const [streamedText, setStreamedText] = useState<Record<number, string>>({});
  const [showDevilsAdvocate, setShowDevilsAdvocate] = useState(false);
  const [showVerdict, setShowVerdict] = useState(false);

  const result = entityId ? MOCK_RESULTS[entityId] : null;

  useEffect(() => {
    if (!result) return;

    // Start streaming after a brief delay
    const startTimer = setTimeout(() => {
      setPhase("streaming");
      streamAgents();
    }, 500);

    return () => clearTimeout(startTimer);
  }, [entityId]);

  const streamAgents = async () => {
    if (!result) return;

    // Stream each agent sequentially
    for (let i = 0; i < result.agents.length; i++) {
      setStreamingAgentIndex(i);
      setProgress(((i + 1) / result.agents.length) * 100);

      const agent = result.agents[i];
      const chunks = generateAgentStream(agent);

      // Stream text chunks
      for (let j = 0; j < chunks.length; j++) {
        await new Promise((resolve) => setTimeout(resolve, 30));
        setStreamedText((prev) => ({
          ...prev,
          [i]: chunks.slice(0, j + 1).join(""),
        }));
      }

      // Add completed agent
      await new Promise((resolve) => setTimeout(resolve, 200));
      setAgentOutputs((prev) => [...prev, agent]);
    }

    // Show Devil's Advocate after all agents
    await new Promise((resolve) => setTimeout(resolve, 500));
    setShowDevilsAdvocate(true);

    // Show verdict
    await new Promise((resolve) => setTimeout(resolve, 800));
    setShowVerdict(true);
    setPhase("complete");
  };

  const handleExportVerdict = async () => {
    if (!verdictCardRef.current) return;

    try {
      const canvas = await html2canvas(verdictCardRef.current, {
        backgroundColor: "#0f172a",
        scale: 2,
      });

      const link = document.createElement("a");
      link.download = `strata-verdict-${entityId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-8">
            <p className="text-white">Entity not found</p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                {mode === "neighborhood" ? (
                  <MapPin className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Building2 className="h-5 w-5 text-emerald-400" />
                )}
                <div>
                  <h1 className="text-lg font-semibold text-white">{result.entity.name}</h1>
                  <p className="text-xs text-slate-400">
                    {mode === "neighborhood" ? "Neighborhood Analysis" : "Corporate Analysis"}
                  </p>
                </div>
              </div>
            </div>
            {showVerdict && (
              <Button
                onClick={handleExportVerdict}
                variant="outline"
                size="sm"
                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Verdict
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Map for Neighborhood Mode */}
        {mode === "neighborhood" && result.entity.location && (
          <div className="mb-8">
            <MapView location={result.entity.location} name={result.entity.name} />
          </div>
        )}

        {/* Analysis Progress */}
        {phase === "streaming" && (
          <Card className="mb-8 bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Analysis in Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">
                    Agent {streamingAgentIndex + 1} of {result.agents.length}
                  </span>
                  <span className="text-slate-400">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agent Committee */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">AI Committee Analysis</h2>
          <div className="grid grid-cols-1 gap-4">
            {result.agents.map((agent, index) => (
              <AgentCard
                key={agent.agentName}
                agent={agent}
                isStreaming={streamingAgentIndex === index}
                streamedText={streamedText[index]}
                isComplete={index < agentOutputs.length}
              />
            ))}
          </div>
        </div>

        {/* Devil's Advocate */}
        {showDevilsAdvocate && (
          <div className="mb-8">
            <DissentMap devilsAdvocate={result.devilsAdvocate} />
          </div>
        )}

        {/* Verdict and Radar */}
        {showVerdict && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div ref={verdictCardRef}>
              <VerdictCard
                verdict={result.verdict}
                dissentLevel={result.dissentLevel}
                dissentScore={result.dissentScore}
                entityName={result.entity.name}
              />
            </div>
            <RadarChart data={result.radarData} />
          </div>
        )}

        {/* Suggested Questions */}
        {showVerdict && (
          <div className="mb-8">
            <SuggestedQuestions questions={result.suggestedQuestions} verdict={result.verdict} />
          </div>
        )}

        {/* No-Expansion Actions (Corporate Mode Only) */}
        {showVerdict && mode === "corporate" && result.noExpansionActions && (
          <div className="mb-8">
            <NoExpansionActions actions={result.noExpansionActions} />
          </div>
        )}

        {/* Problem Statement */}
        {showVerdict && (
          <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-slate-700">
            <CardHeader>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 mt-1" />
                <div>
                  <CardTitle className="text-white text-lg">Why This Matters</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 leading-relaxed">
                ESG investing manages $35 trillion in assets. Urban climate resilience receives hundreds of billions
                in government spending annually. Both fields have the same problem: the tools that measure
                sustainability tell you what exists today, not what's happening next—and none of them tell you who
                benefits. A neighborhood can score 8/10 on green coverage while simultaneously displacing every
                resident who originally lived there. STRATA is the first system that debates direction instead of
                scoring a snapshot, and makes the uncertainty visible instead of hiding it behind a single number.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

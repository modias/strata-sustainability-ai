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
import {
  MOCK_RESULTS,
  AgentOutput,
  generateAgentStream,
  SNOWFLAKE_ENTITY_ID,
  ENTITIES,
  type AnalysisResult,
  type Verdict,
  type DissentLevel,
  type DevilsAdvocateChallenge,
} from "../data/mockData";
import { VerdictHistory } from "./VerdictHistory";
import { API_BASE } from "../lib/apiBase";
import html2canvas from "html2canvas";

type AnalysisPhase = "idle" | "streaming" | "complete";

type AnalyzeApiData = {
  entity_id: string | null;
  target?: string | null;
  mode?: string | null;
  final_score: number | null;
  verdict: string | null;
  trajectory: string | null;
  dissent_score: number | null;
  agent_scores: unknown;
  judge_output: Record<string, unknown> | null;
  created_at: string | null;
};

type AnalyzeResponse = {
  found: boolean;
  entity_id: string;
  data: AnalyzeApiData | null;
};

function isVerdict(value: string): value is Verdict {
  return value === "IMPROVING" || value === "STAGNANT" || value === "DECLINING" || value === "CONTESTED";
}

function isDissentLevel(value: string): value is DissentLevel {
  return value === "LOW" || value === "MODERATE" || value === "HIGH";
}

function dissentLevelFromScore(score: number): DissentLevel {
  if (score < 0.33) return "LOW";
  if (score < 0.66) return "MODERATE";
  return "HIGH";
}

function normalizeAgent(o: Record<string, unknown>): AgentOutput | null {
  const agentName = String(o.agentName ?? o.agent_name ?? "Agent");
  const score = Number(o.score ?? 0);
  const confidence = Number(o.confidence ?? 0);
  const keyFindings = Array.isArray(o.keyFindings)
    ? o.keyFindings.map(String)
    : Array.isArray(o.key_findings)
      ? o.key_findings.map(String)
      : [];
  const dataSource = String(o.dataSource ?? o.data_source ?? "");
  const reasoning = String(o.reasoning ?? "");
  return { agentName, score, confidence, keyFindings, dataSource, reasoning };
}

function normalizeDevils(o: Record<string, unknown> | null): DevilsAdvocateChallenge | null {
  if (!o) return null;
  return {
    targetAgent: String(o.targetAgent ?? o.target_agent ?? ""),
    challenge: String(o.challenge ?? ""),
    counterDataSource: String(o.counterDataSource ?? o.counter_data_source ?? ""),
    specificDataPoint: String(o.specificDataPoint ?? o.specific_data_point ?? ""),
  };
}

function normalizeRadar(arr: unknown): AnalysisResult["radarData"] {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => {
    if (!item || typeof item !== "object") {
      return { dimension: "", score: 0, fullMark: 100 as const };
    }
    const r = item as Record<string, unknown>;
    return {
      dimension: String(r.dimension ?? ""),
      score: Number(r.score ?? 0),
      fullMark: 100 as const,
    };
  });
}

function mapAnalyzeResponseToResult(
  routeEntityId: string,
  api: AnalyzeApiData,
  mock: AnalysisResult | undefined
): AnalysisResult | null {
  const entity = ENTITIES.find((e) => e.id === routeEntityId);
  if (!entity) return null;

  const judge =
    api.judge_output && typeof api.judge_output === "object"
      ? (api.judge_output as Record<string, unknown>)
      : {};

  const agentsRaw = api.agent_scores;
  const agents: AgentOutput[] = [];
  if (Array.isArray(agentsRaw)) {
    for (const a of agentsRaw) {
      if (a && typeof a === "object") {
        const n = normalizeAgent(a as Record<string, unknown>);
        if (n) agents.push(n);
      }
    }
  }

  const verdictRaw = String(api.verdict ?? mock?.verdict ?? "STAGNANT");
  const verdict: Verdict = isVerdict(verdictRaw) ? verdictRaw : (mock?.verdict ?? "STAGNANT");

  const dissentScore =
    api.dissent_score != null && Number.isFinite(Number(api.dissent_score))
      ? Number(api.dissent_score)
      : (mock?.dissentScore ?? 0);

  let dissentLevel: DissentLevel;
  if (typeof judge.dissent_level === "string" && isDissentLevel(judge.dissent_level)) {
    dissentLevel = judge.dissent_level;
  } else if (typeof judge.dissentLevel === "string" && isDissentLevel(judge.dissentLevel)) {
    dissentLevel = judge.dissentLevel;
  } else {
    dissentLevel = mock?.dissentLevel ?? dissentLevelFromScore(dissentScore);
  }

  const devilsRaw =
    judge.devils_advocate ?? judge.devilsAdvocate ?? judge.devilsAdvocateChallenge;
  const devils = normalizeDevils(
    devilsRaw && typeof devilsRaw === "object" ? (devilsRaw as Record<string, unknown>) : null
  );

  let radarData = normalizeRadar(judge.radar_data ?? judge.radarData);
  if (!radarData.length && agents.length) {
    radarData = agents.map((a) => ({
      dimension: a.agentName,
      score: a.score,
      fullMark: 100 as const,
    }));
  }
  if (!radarData.length && mock?.radarData?.length) {
    radarData = mock.radarData;
  }

  const sqRaw = judge.suggested_questions ?? judge.suggestedQuestions;
  let suggestedQuestions: string[] = [];
  if (Array.isArray(sqRaw) && sqRaw.length) {
    suggestedQuestions = sqRaw.map(String);
  } else if (mock?.suggestedQuestions) {
    suggestedQuestions = mock.suggestedQuestions;
  }

  const neRaw = judge.no_expansion_actions ?? judge.noExpansionActions;
  const noExpansionActions = Array.isArray(neRaw)
    ? (neRaw as NonNullable<AnalysisResult["noExpansionActions"]>)
    : mock?.noExpansionActions;

  const finalAgents = agents.length ? agents : (mock?.agents ?? []);
  const emptyDevils: DevilsAdvocateChallenge = {
    targetAgent: "",
    challenge: "",
    counterDataSource: "",
    specificDataPoint: "",
  };
  const finalDevils = devils ?? mock?.devilsAdvocate ?? emptyDevils;

  return {
    entity: mock?.entity ?? entity,
    verdict,
    dissentLevel,
    dissentScore,
    agents: finalAgents,
    devilsAdvocate: finalDevils,
    radarData,
    suggestedQuestions,
    noExpansionActions,
  };
}

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

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usedMockFallback, setUsedMockFallback] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  const snowflakeHistoryEntityId = entityId ? SNOWFLAKE_ENTITY_ID[entityId] ?? entityId : "";

  useEffect(() => {
    if (!entityId) {
      setResult(null);
      setLoading(false);
      setError(null);
      setUsedMockFallback(false);
      return;
    }

    const snowflakeEntityId = SNOWFLAKE_ENTITY_ID[entityId] ?? entityId;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setUsedMockFallback(false);

    fetch(`${API_BASE}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity_id: snowflakeEntityId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<AnalyzeResponse>;
      })
      .then((payload) => {
        if (cancelled) return;
        const mock = MOCK_RESULTS[entityId];
        if (payload.found && payload.data) {
          const mapped = mapAnalyzeResponseToResult(entityId, payload.data, mock);
          if (mapped) {
            setResult(mapped);
            setUsedMockFallback(false);
            return;
          }
        }
        if (mock) {
          setResult(mock);
          setUsedMockFallback(true);
        } else {
          setResult(null);
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Request failed");
        const mock = MOCK_RESULTS[entityId];
        if (mock) {
          setResult(mock);
          setUsedMockFallback(true);
        } else {
          setResult(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [entityId]);

  useEffect(() => {
    if (!result) return;

    setPhase("idle");
    setProgress(0);
    setStreamingAgentIndex(-1);
    setAgentOutputs([]);
    setStreamedText({});
    setShowDevilsAdvocate(false);
    setShowVerdict(false);

    const startTimer = setTimeout(() => {
      setPhase("streaming");
      void (async () => {
        const r = result;
        for (let i = 0; i < r.agents.length; i++) {
          setStreamingAgentIndex(i);
          setProgress(((i + 1) / r.agents.length) * 100);

          const agent = r.agents[i];
          const chunks = generateAgentStream(agent);

          for (let j = 0; j < chunks.length; j++) {
            await new Promise((resolve) => setTimeout(resolve, 30));
            setStreamedText((prev) => ({
              ...prev,
              [i]: chunks.slice(0, j + 1).join(""),
            }));
          }

          await new Promise((resolve) => setTimeout(resolve, 200));
          setAgentOutputs((prev) => [...prev, agent]);
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
        setShowDevilsAdvocate(true);

        try {
          if (snowflakeHistoryEntityId) {
            const res = await fetch(`${API_BASE}/analyze`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ entity_id: snowflakeHistoryEntityId }),
            });
            if (!res.ok) {
              console.warn("Analyze POST failed:", res.status);
            } else {
              setHistoryKey((k) => k + 1);
            }
          }
        } catch (e) {
          console.warn("Analyze POST error:", e);
        }

        await new Promise((resolve) => setTimeout(resolve, 800));
        setShowVerdict(true);
        setPhase("complete");
      })();
    }, 500);

    return () => clearTimeout(startTimer);
  }, [entityId, result]);

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
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  if (loading && !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-8">
            <p className="text-white">Loading analysis…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-8">
            {error && <p className="text-red-400 mb-2">{error}</p>}
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
            <div className="flex items-center gap-2">
              {(error || usedMockFallback) && (
                <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-xs">
                  {error ? "Live API unavailable — showing cached demo data" : "Demo data (no Snowflake row)"}
                </Badge>
              )}
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
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {mode === "neighborhood" && result.entity.location && (
          <div className="mb-8">
            <MapView location={result.entity.location} name={result.entity.name} />
          </div>
        )}

        {phase === "streaming" && (
          <Card className="mb-8 bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Analysis in Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">
                    Perspective {streamingAgentIndex + 1} of {result.agents.length}
                  </span>
                  <span className="text-slate-400">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Multi-angle review</h2>
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

        {showDevilsAdvocate && (
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <DissentMap devilsAdvocate={result.devilsAdvocate} />
            <VerdictHistory entityId={snowflakeHistoryEntityId} refreshKey={historyKey} />
          </div>
        )}

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

        {showVerdict && (
          <div className="mb-8">
            <SuggestedQuestions questions={result.suggestedQuestions} verdict={result.verdict} />
          </div>
        )}

        {showVerdict && mode === "corporate" && result.noExpansionActions && (
          <div className="mb-8">
            <NoExpansionActions actions={result.noExpansionActions} />
          </div>
        )}

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
                sustainability tell you what exists today, not what&apos;s happening next—and none of them tell you who
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

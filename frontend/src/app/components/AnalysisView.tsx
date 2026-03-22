import { useState, useEffect, useRef, useCallback } from "react";
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
  type Entity,
} from "../data/mockData";
import { VerdictHistory } from "./VerdictHistory";
import { API_BASE } from "../lib/apiBase";
import html2canvas from "html2canvas";

const STREAM_DEMO_TARGET: Record<string, string> = {
  "anacostia-dc": "anacostia",
  "phoenix-south": "phoenix_south",
  "detroit-midtown": "detroit_midtown",
  "greenpoint-brooklyn": "greenpoint-brooklyn",
  "mission-district-sf": "mission-district-sf",
  tesla: "tesla",
  amazon: "amazon",
  microsoft: "microsoft",
  apple: "apple",
  google: "google",
  nvidia: "nvidia",
  samsung: "samsung",
  "hub-austin-tx": "hub-austin-tx",
  "hub-boston-ma": "hub-boston-ma",
  "hub-new-york-ny": "hub-new-york-ny",
  "hub-san-francisco-ca": "hub-san-francisco-ca",
  "hub-nyc-ny": "hub-nyc-ny",
  "hub-sf-bay-ca": "hub-sf-bay-ca",
  "hub-seattle-wa": "hub-seattle-wa",
  "hub-washington-dc": "hub-washington-dc",
  unilever: "unilever",
  patagonia: "patagonia",
  "east-austin": "east-austin",
};

function geminiAgentToAgentOutput(raw: Record<string, unknown>, index: number): AgentOutput {
  const positives = Array.isArray(raw.positives) ? raw.positives.map(String) : [];
  const risks = Array.isArray(raw.risks) ? raw.risks.map(String) : [];
  const err = raw.error != null ? String(raw.error) : "";
  const keyFindings = [
    ...(err ? [`Error: ${err}`] : []),
    ...positives,
    ...risks.map((r) => `Risk: ${r}`),
  ];
  const claim = String(raw.claim ?? "");
  return {
    agentName: String(raw.name ?? `Agent ${index + 1}`),
    score: Number(raw.score ?? 50),
    confidence: Number(raw.confidence ?? 0.5),
    keyFindings: keyFindings.length ? keyFindings : [claim || "—"],
    dataSource: String(raw.dataSource ?? "Google Gemini"),
    reasoning: String(raw.reasoning ?? claim),
  };
}

function numOrUndef(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** CV numbers from a flat or evidence-wrapped agent/judge payload */
function extractCvFromPacketLike(source: Record<string, unknown>): Partial<Entity> {
  const ev =
    source.evidence && typeof source.evidence === "object"
      ? (source.evidence as Record<string, unknown>)
      : {};
  const gsr = numOrUndef(
    source.green_space_ratio ??
      source.greenSpaceRatio ??
      ev.green_space_ratio ??
      ev.greenSpaceRatio
  );
  const his = numOrUndef(
    source.heat_intensity_score ??
      source.heatIntensityScore ??
      ev.heat_intensity_score ??
      ev.heatIntensityScore
  );
  const pm = numOrUndef(
    source.air_quality_pm25 ??
      source.airQualityPm25 ??
      ev.air_quality_pm25 ??
      ev.airQualityPm25
  );
  const out: Partial<Entity> = {};
  if (gsr !== undefined) out.greenSpaceRatio = gsr;
  if (his !== undefined) out.heatIntensityScore = Math.round(his);
  if (pm !== undefined) out.airQualityPm25 = pm;
  return out;
}

function mergeCvFromJudge(judge: Record<string, unknown>): Partial<Entity> {
  let acc: Partial<Entity> = { ...extractCvFromPacketLike(judge) };
  for (const key of ["evidence", "evidence_packet", "evidencePacket"] as const) {
    const v = judge[key];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      acc = { ...acc, ...extractCvFromPacketLike(v as Record<string, unknown>) };
    }
  }
  return acc;
}

function judgeToUpdates(judge: Record<string, unknown>) {
  return {
    verdict: judge.verdict ?? "CONTESTED",
    finalScore: judge.final_score ?? 50,
    trajectory: judge.trajectory ?? "flat",
    rationale: judge.rationale ?? "",
    topSupportReason: judge.top_support_reason ?? "",
    topDissentReason: judge.top_dissent_reason ?? "",
  };
}

const EXPECTED_AGENT_STREAM_COUNT = 4;

type SavePointData = {
  result?: AnalysisResult;
  agents?: AgentOutput[];
};

type SavePointStored = {
  phase: string;
  data: SavePointData;
  savedAt: number;
};

function restorePoint(entityId: string): SavePointStored | null {
  try {
    const raw = localStorage.getItem(`strata:savepoint:${entityId}`);
    return raw ? (JSON.parse(raw) as SavePointStored) : null;
  } catch {
    return null;
  }
}

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
    radarData = agents.map((a, index) => ({
      dimension: `${index + 1}. ${a.agentName}`,
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

function mergeJudgeIntoResult(prev: AnalysisResult, judge: Record<string, unknown>): AnalysisResult {
  const u = judgeToUpdates(judge);
  const verdictStr = String(u.verdict);
  const verdict: Verdict = isVerdict(verdictStr) ? verdictStr : "CONTESTED";
  const finalScore = Number(u.finalScore);
  const dissentScore = Math.min(1, Math.max(0, 1 - finalScore / 100));
  const dissentLevel = dissentLevelFromScore(dissentScore);
  const support = String(u.topSupportReason);
  const dissent = String(u.topDissentReason);
  const rationale = String(u.rationale);
  const cvFromJudge = mergeCvFromJudge(judge);
  const radarData = prev.agents.map((a, index) => ({
    dimension: `${index + 1}. ${a.agentName}`,
    score: a.score,
    fullMark: 100 as const,
  }));
  return {
    ...prev,
    entity: { ...prev.entity, ...cvFromJudge },
    verdict,
    dissentLevel,
    dissentScore,
    devilsAdvocate: {
      targetAgent: prev.agents[0]?.agentName ?? "",
      challenge: support && dissent ? `${support} · ${dissent}` : rationale,
      counterDataSource: "Google Gemini",
      specificDataPoint: rationale,
    },
    radarData,
    suggestedQuestions: [support, dissent].filter(Boolean),
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
  const [userQuestion, setUserQuestion] = useState("");
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [askingQuestion, setAskingQuestion] = useState(false);

  const snowflakeHistoryEntityId = entityId ? SNOWFLAKE_ENTITY_ID[entityId] ?? entityId : "";

  const handleAskQuestion = async (overrideQ?: string) => {
    const q = overrideQ ?? userQuestion;
    if (!q.trim()) return;
    setAskingQuestion(true);
    setQuestionAnswer("");
    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          entity: result?.entity?.name,
          verdict: result?.verdict,
          agents: agentOutputs,
          context:
            (result as { rationale?: string } | null)?.rationale ??
            result?.devilsAdvocate?.specificDataPoint ??
            result?.devilsAdvocate?.challenge,
        }),
      });
      const data = (await res.json()) as { answer?: string };
      if (!res.ok) {
        setQuestionAnswer(data.answer ?? `Request failed (${res.status})`);
        return;
      }
      setQuestionAnswer(data.answer ?? "No answer available");
    } catch {
      setQuestionAnswer("Could not reach the committee. Try again.");
    } finally {
      setAskingQuestion(false);
      setUserQuestion("");
    }
  };

  const savePoint = useCallback((phase: string, data: SavePointData) => {
    if (!entityId) return;
    try {
      localStorage.setItem(
        `strata:savepoint:${entityId}`,
        JSON.stringify({ phase, data, savedAt: Date.now() })
      );
    } catch (e) {
      console.warn("SavePoint failed", e);
    }
  }, [entityId]);

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
    if (!entityId || loading || !result) return;

    const saved = restorePoint(entityId);
    if (
      saved &&
      Date.now() - saved.savedAt < 3600000 &&
      saved.phase === "complete" &&
      saved.data?.result
    ) {
      setResult(saved.data.result);
      const savedAgents = saved.data.agents;
      const fromResult = saved.data.result.agents ?? [];
      setAgentOutputs(
        Array.isArray(savedAgents) && savedAgents.length > 0 ? savedAgents : fromResult
      );
      setPhase("complete");
      setShowVerdict(true);
      setShowDevilsAdvocate(true);
      setUsedMockFallback(false);
      setProgress(100);
      return;
    }

    const initialResult = result;

    setPhase("idle");
    setProgress(0);
    setStreamingAgentIndex(-1);
    setAgentOutputs([]);
    setStreamedText({});
    setShowDevilsAdvocate(false);
    setShowVerdict(false);

    let cancelled = false;
    let es: EventSource | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const runMockStreaming = async (r: AnalysisResult) => {
      for (let i = 0; i < r.agents.length; i++) {
        if (cancelled) return;
        const agent = r.agents[i];
        setStreamingAgentIndex(i);
        setProgress(((i + 1) / r.agents.length) * 100);
        setAgentOutputs((prev) => [...prev, agent]);
        setTimeout(() => {
          document.getElementById("agent-list")?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 100);

        const chunks = generateAgentStream(agent);

        for (let j = 0; j < chunks.length; j++) {
          await new Promise((resolve) => setTimeout(resolve, 30));
          setStreamedText((prev) => ({
            ...prev,
            [i]: chunks.slice(0, j + 1).join(""),
          }));
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      setStreamingAgentIndex(-1);

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
      savePoint("complete", { result: r, agents: r.agents });
    };

    const applyMockFallback = () => {
      if (cancelled) return;
      if (es) {
        es.close();
        es = null;
      }
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      setResult(initialResult);
      setUsedMockFallback(true);
      void runMockStreaming(initialResult);
    };

    const startTimer = setTimeout(() => {
      if (cancelled) return;
      setPhase("streaming");
      setResult((prev) => (prev ? { ...prev, agents: [] } : null));

      let agentCount = 0;
      const streamTarget = STREAM_DEMO_TARGET[entityId] ?? entityId;
      const modeParam =
        mode === "neighborhood" ? "neighborhood" : mode === "hub" ? "hub" : "company";

      fallbackTimer = setTimeout(() => {
        if (agentCount === 0) {
          applyMockFallback();
        }
      }, 5000);

      es = new EventSource(
        `${API_BASE}/analyze/stream?target=${encodeURIComponent(streamTarget)}&mode=${encodeURIComponent(modeParam)}`
      );

      es.addEventListener("round_start", () => {
        if (fallbackTimer) {
          clearTimeout(fallbackTimer);
          fallbackTimer = null;
        }
      });

      es.addEventListener("agents_start", () => {
        if (fallbackTimer) {
          clearTimeout(fallbackTimer);
          fallbackTimer = null;
        }
        savePoint("agents_start", { result: { ...initialResult, agents: [] } });
      });

      es.addEventListener("agent_result", (e) => {
        const ev = e as MessageEvent;
        const raw = JSON.parse(ev.data) as Record<string, unknown>;
        const agent = geminiAgentToAgentOutput(raw, agentCount);
        const rawName = String(raw.name ?? "");
        agentCount++;
        setResult((prev) => {
          if (!prev) return null;
          const nextAgents = [...(prev.agents ?? []), agent];
          let nextEntity = prev.entity;
          if (rawName === "Environmental" || rawName === "Risk") {
            const cv = extractCvFromPacketLike(raw);
            nextEntity = {
              ...prev.entity,
              greenSpaceRatio: cv.greenSpaceRatio ?? prev.entity.greenSpaceRatio,
              heatIntensityScore: cv.heatIntensityScore ?? prev.entity.heatIntensityScore,
              airQualityPm25: cv.airQualityPm25 ?? prev.entity.airQualityPm25,
            };
          }
          const nextResult = { ...prev, agents: nextAgents, entity: nextEntity };
          savePoint("streaming", { result: nextResult, agents: nextAgents });
          return nextResult;
        });
        setAgentOutputs((prev) => [...prev, agent]);
        setTimeout(() => {
          document.getElementById("agent-list")?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 100);
        setProgress((agentCount / EXPECTED_AGENT_STREAM_COUNT) * 100);
      });

      es.addEventListener("verdict", (e) => {
        const ev = e as MessageEvent;
        const judge = JSON.parse(ev.data) as Record<string, unknown>;
        setResult((prev) => {
          if (!prev) return null;
          const merged = mergeJudgeIntoResult(prev, judge);
          savePoint("verdict", { result: merged, agents: merged.agents });
          return merged;
        });
        setShowDevilsAdvocate(true);
      });

      es.addEventListener("complete", () => {
        if (fallbackTimer) {
          clearTimeout(fallbackTimer);
          fallbackTimer = null;
        }
        es?.close();
        es = null;
        setShowVerdict(true);
        setPhase("complete");
        setHistoryKey((k) => k + 1);
        setResult((prev) => {
          if (prev) {
            savePoint("complete", { result: prev, agents: prev.agents });
          }
          return prev;
        });
      });

      es.addEventListener("error", () => {
        es?.close();
        es = null;
        if (agentCount === 0) {
          applyMockFallback();
        }
      });
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      es?.close();
    };
  }, [entityId, loading, mode, snowflakeHistoryEntityId, savePoint]);

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

  const handleBack = () => {
    if (entityId) localStorage.removeItem(`strata:savepoint:${entityId}`);
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
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
              {phase === "complete" && (
                <button
                  type="button"
                  onClick={() => {
                    if (entityId) localStorage.removeItem(`strata:savepoint:${entityId}`);
                    window.location.reload();
                  }}
                  className="text-xs text-slate-400 hover:text-white border border-slate-600 rounded px-3 py-1 transition-colors"
                >
                  ↺ Rerun Analysis
                </button>
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
        {(mode === "neighborhood" || mode === "hub") && result.entity.location && (
          <div className="mb-8">
            <MapView
              location={result.entity.location}
              name={result.entity.name}
              greenScore={result.entity.greenSpaceRatio}
            />
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
                    Perspective{" "}
                    {streamingAgentIndex >= 0
                      ? streamingAgentIndex + 1
                      : Math.min(result.agents.length + 1, EXPECTED_AGENT_STREAM_COUNT)}{" "}
                    of {EXPECTED_AGENT_STREAM_COUNT}
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
          {phase === "streaming" && (
            <div className="flex items-center gap-2 text-xs text-green-400 font-mono mb-3 animate-pulse">
              <span>●</span>
              <span>COMMITTEE IN SESSION — {agentOutputs.length} of 4 agents responded</span>
            </div>
          )}
          <div id="agent-list" className="grid grid-cols-1 gap-4">
            {agentOutputs.length > 0 &&
              agentOutputs.map((agent, index) => (
                <AgentCard
                  key={`${agent.agentName}-${index}`}
                  agent={agent}
                  isStreaming={streamingAgentIndex === index}
                  streamedText={streamedText[index]}
                  isComplete={
                    phase === "complete" ||
                    streamingAgentIndex !== index ||
                    streamingAgentIndex < 0
                  }
                  className={
                    phase === "streaming" && index === agentOutputs.length - 1
                      ? "ring-1 ring-green-400/50 animate-pulse"
                      : ""
                  }
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

        {result && phase === "complete" && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Sustainability Recommendations</h2>
            <div className="space-y-3">
              {[
                {
                  action:
                    result.verdict === "DECLINING" || result.verdict === "CONTESTED"
                      ? "Immediate: Commission independent displacement impact assessment"
                      : "Immediate: Expand green infrastructure to underserved areas",
                  impact: "High",
                  timeframe: "90 days",
                  cost: "$0 capex",
                },
                {
                  action:
                    result.verdict === "DECLINING"
                      ? "Short-term: Establish community benefit agreement for all new permits"
                      : "Short-term: Implement green roof requirements for new construction",
                  impact: "High",
                  timeframe: "6 months",
                  cost: "Policy change",
                },
                {
                  action: "Long-term: Set measurable green coverage targets with annual reporting",
                  impact: "Medium",
                  timeframe: "12 months",
                  cost: "< $50k",
                },
              ].map((rec, i) => (
                <div key={i} className="p-4 rounded-lg border border-border bg-card">
                  <div className="font-medium text-sm mb-2">{rec.action}</div>
                  <div className="flex gap-4 text-xs text-muted-foreground font-mono">
                    <span className="text-green-400">Impact: {rec.impact}</span>
                    <span>{rec.timeframe}</span>
                    <span>{rec.cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === "complete" && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Ask the Committee</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleAskQuestion();
                  }
                }}
                placeholder="Ask anything about this analysis..."
                className="flex-1 bg-card border border-border rounded-lg px-4 py-2 text-sm outline-none focus:border-green-400/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => void handleAskQuestion()}
                disabled={!userQuestion.trim() || askingQuestion}
                className="px-4 py-2 bg-green-400/10 border border-green-400/30 text-green-400 rounded-lg text-sm font-mono hover:bg-green-400/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {askingQuestion ? "Thinking..." : "Ask →"}
              </button>
            </div>

            {questionAnswer && (
              <div className="p-4 rounded-lg border border-green-400/20 bg-green-400/5 text-sm leading-relaxed text-slate-200">
                {questionAnswer}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              {[
                "Who benefits from this investment?",
                "What would change this verdict?",
                "Which agent has lowest confidence?",
                "What is the displacement risk?",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setUserQuestion(q);
                    void handleAskQuestion(q);
                  }}
                  className="text-xs px-3 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-green-400/30 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {showVerdict && result && result.entity && (
          <div className="mb-6 p-4 rounded-lg border border-border bg-card">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
              CV Metrics
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Green Coverage</div>
                <div className="text-xl font-bold text-green-400">
                  {result.entity.greenSpaceRatio != null
                    ? `${(result.entity.greenSpaceRatio * 100).toFixed(0)}%`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Heat Intensity</div>
                <div className="text-xl font-bold text-orange-400">
                  {result.entity.heatIntensityScore ?? "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Air Quality PM2.5</div>
                <div className="text-xl font-bold text-blue-400">
                  {result.entity.airQualityPm25 ?? "—"}
                </div>
              </div>
            </div>
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

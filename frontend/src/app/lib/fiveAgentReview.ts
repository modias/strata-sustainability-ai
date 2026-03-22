import type { AgentOutput, AnalysisResult, AgentMetric } from "../data/mockData";
import {
  AGENT_HEADING_DEVILS_ADVOCATE,
  AGENT_HEADING_ENVIRONMENTAL,
  AGENT_HEADING_MOMENTUM,
  AGENT_HEADING_RISK,
  AGENT_HEADING_SOCIAL,
  headingForRadarDimension,
} from "./radarAgentHeadings";

/** UI order: Environmental → Momentum → Risk → Social → Devil's Advocate Agent. */
export const FIVE_AGENT_REVIEW_ORDER = [
  AGENT_HEADING_ENVIRONMENTAL,
  AGENT_HEADING_MOMENTUM,
  AGENT_HEADING_RISK,
  AGENT_HEADING_SOCIAL,
  AGENT_HEADING_DEVILS_ADVOCATE,
] as const;

function roleKeyFromAgent(agent: AgentOutput): string {
  return agent.committeeRole ?? headingForRadarDimension(agent.agentName);
}

function groupAgentsByRole(agents: AgentOutput[]): Map<string, AgentOutput[]> {
  const m = new Map<string, AgentOutput[]>();
  for (const a of agents) {
    const k = roleKeyFromAgent(a);
    const arr = m.get(k) ?? [];
    arr.push(a);
    m.set(k, arr);
  }
  return m;
}

function metricsFromRadar(result: AnalysisResult): Map<string, AgentMetric[]> {
  const m = new Map<string, AgentMetric[]>();
  for (const row of result.radarData) {
    const role = headingForRadarDimension(row.dimension);
    const list = m.get(role) ?? [];
    list.push({
      label: row.dimension.replace(/^\d+\.\s*/, "").trim(),
      score: row.score,
      fullMark: row.fullMark,
    });
    m.set(role, list);
  }
  return m;
}

function averageScore(metrics: AgentMetric[]): number {
  if (!metrics.length) return 0;
  return Math.round(metrics.reduce((s, x) => s + x.score, 0) / metrics.length);
}

function mergeReasoning(agents: AgentOutput[]): string {
  const parts = agents.map((a) => a.reasoning).filter(Boolean);
  return parts.length ? parts.join("\n\n") : "";
}

function mergeFindings(agents: AgentOutput[]): string[] {
  return agents.flatMap((a) => a.keyFindings ?? []);
}

function mergeSources(agents: AgentOutput[]): string {
  const s = new Set(agents.map((a) => a.dataSource).filter(Boolean));
  return [...s].join(" · ") || "—";
}

function averageConfidence(agents: AgentOutput[]): number {
  if (!agents.length) return 0.5;
  return agents.reduce((s, a) => s + (a.confidence ?? 0.5), 0) / agents.length;
}

/**
 * Five committee panels with per-role metrics (from radar) and narratives (from streamed/API agents).
 * Devil's Advocate Agent is synthesized from committee dissent + devil's advocate challenge content.
 */
export function buildFiveAgentReview(result: AnalysisResult, agentOutputs: AgentOutput[]): AgentOutput[] {
  const source = agentOutputs.length > 0 ? agentOutputs : result.agents;
  const byRole = groupAgentsByRole(source);
  const radarByRole = metricsFromRadar(result);

  const buildDevilsAdvocate = (): AgentOutput => {
    let metrics = radarByRole.get(AGENT_HEADING_DEVILS_ADVOCATE) ?? [];
    if (metrics.length === 0) {
      const overall = result.radarData.find((r) => /\boverall\b/i.test(r.dimension));
      if (overall) {
        metrics = [
          {
            label: overall.dimension.replace(/^\d+\.\s*/, "").trim(),
            score: overall.score,
            fullMark: overall.fullMark,
          },
        ];
      }
    }

    const score = averageScore(metrics);
    const da = result.devilsAdvocate;
    const reasoning = [
      `Verdict: ${result.verdict}. Dissent level: ${result.dissentLevel} (dissent score ${(result.dissentScore * 100).toFixed(0)}%).`,
      da?.challenge ? `Challenge: ${da.challenge}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const keyFindings = [
      da?.specificDataPoint ? `Contested data point: ${da.specificDataPoint}` : "",
      da?.targetAgent ? `Challenge target: ${da.targetAgent}` : "",
      da?.counterDataSource ? `Counter source: ${da.counterDataSource}` : "",
    ].filter(Boolean) as string[];

    return {
      agentName: "Devil's Advocate Agent",
      committeeRole: AGENT_HEADING_DEVILS_ADVOCATE,
      score,
      confidence: 0.85,
      metrics,
      reasoning: reasoning || "Devil's advocate synthesis is not available for this run.",
      keyFindings: keyFindings.length ? keyFindings : ["No devil's advocate detail in this snapshot."],
      dataSource: da?.counterDataSource ? `${da.counterDataSource} · committee synthesis` : "committee synthesis",
    };
  };

  const buildRole = (role: string): AgentOutput => {
    if (role === AGENT_HEADING_DEVILS_ADVOCATE) {
      return buildDevilsAdvocate();
    }

    const agents = byRole.get(role) ?? [];
    /** Only radar-backed rows count as listed data metrics; no synthetic placeholder rows. */
    const metrics = radarByRole.get(role) ?? [];

    const score = averageScore(metrics);
    const reasoning =
      mergeReasoning(agents) ||
      (metrics.length === 0
        ? `No radar metrics are listed for ${role} in this analysis.`
        : `No ${role.replace(/\s+Agent$/, "").toLowerCase()} narrative was returned for this entity in the live stream.`);

    return {
      agentName: role,
      committeeRole: role,
      score,
      confidence: agents.length ? averageConfidence(agents) : 0.5,
      metrics,
      reasoning,
      keyFindings: mergeFindings(agents).slice(0, 8),
      dataSource: mergeSources(agents),
    };
  };

  return FIVE_AGENT_REVIEW_ORDER.map((role) => buildRole(role));
}

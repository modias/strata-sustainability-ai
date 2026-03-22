import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { AgentOutput } from "../data/mockData";
import { getAgentCardHeadings } from "../lib/radarAgentHeadings";
import { Brain, Loader2 } from "lucide-react";
import { cn } from "./ui/utils";

interface AgentCardProps {
  agent: AgentOutput;
  isStreaming: boolean;
  streamedText?: string;
  isComplete: boolean;
  className?: string;
}

export function AgentCard({ agent, isStreaming, streamedText, isComplete, className }: AgentCardProps) {
  const { role, lens } = getAgentCardHeadings(agent.agentName, agent.committeeRole, agent.metricLens);

  /** Streaming agents have no `metrics` → use API score. Completed review uses radar-only metrics; empty list → 0. */
  const displayScore =
    agent.metrics === undefined
      ? agent.score
      : agent.metrics.length > 0
        ? Math.round(agent.metrics.reduce((s, m) => s + m.score, 0) / agent.metrics.length)
        : 0;

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return "bg-emerald-500/10 border-emerald-500/30";
    if (score >= 50) return "bg-amber-500/10 border-amber-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  if (isStreaming && streamedText) {
    return (
      <motion.div
        className={cn("rounded-lg", className)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="space-y-2">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight leading-snug">{role}</h3>
              {lens ? (
                <p className="text-sm text-slate-400 mt-1 font-medium">{lens}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-emerald-400 animate-spin shrink-0" />
              <CardTitle className="text-white text-base font-semibold tracking-tight">
                Analyzing…
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-slate-300 font-sans">{streamedText}</pre>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!isComplete) {
    return null;
  }

  return (
    <motion.div
      className={cn("rounded-lg", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 order-first">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">{role}</h3>
              {lens ? (
                <p className="text-sm text-slate-400 mt-1 font-medium leading-snug">{lens}</p>
              ) : null}
            </div>
            {agent.modelUsed ? (
              <span className="text-xs font-mono text-muted-foreground/40 ml-auto shrink-0 max-w-[50%] truncate text-right order-last">
                {agent.modelUsed}
              </span>
            ) : null}
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center border border-emerald-500/30">
              <Brain className="h-5 w-5 text-emerald-400" />
            </div>
            <div className={`shrink-0 px-4 py-2 rounded-lg border ${getScoreBgColor(displayScore)}`}>
              <div className={`text-2xl font-bold ${getScoreColor(displayScore)}`}>{displayScore}</div>
              <div className="text-xs text-slate-400">
                {agent.metrics !== undefined && agent.metrics.length > 1 ? "avg / 100" : "/ 100"}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {agent.metrics && agent.metrics.length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Data metrics</h4>
              <ul className="space-y-2">
                {agent.metrics.map((m, i) => (
                  <li
                    key={`${m.label}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-slate-700/70 bg-slate-800/40 px-3 py-2"
                  >
                    <span className="text-sm text-slate-300 leading-snug min-w-0">{m.label}</span>
                    <span
                      className={`text-sm font-semibold tabular-nums shrink-0 ${getScoreColor(m.score)}`}
                    >
                      {m.score}
                      <span className="text-slate-500 font-normal"> / {m.fullMark}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Breakdown */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2">Breakdown</h4>
            <p className="text-slate-300 leading-relaxed">{agent.reasoning}</p>
          </div>

          {/* Key Findings */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2">Key Findings</h4>
            <ul className="space-y-2">
              {agent.keyFindings.map((finding, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span className="text-slate-300 text-sm">{finding}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Data Sources */}
          <div>
            <Badge variant="outline" className="border-slate-700 text-slate-400">
              Sources: {agent.dataSource}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

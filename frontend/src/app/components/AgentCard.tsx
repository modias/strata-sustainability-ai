import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { AgentOutput } from "../data/mockData";
import { Brain, Loader2 } from "lucide-react";

interface AgentCardProps {
  agent: AgentOutput;
  isStreaming: boolean;
  streamedText?: string;
  isComplete: boolean;
}

export function AgentCard({ agent, isStreaming, streamedText, isComplete }: AgentCardProps) {
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
              <CardTitle className="text-white text-lg">Analyzing...</CardTitle>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center border border-emerald-500/30">
                <Brain className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">{agent.agentName}</CardTitle>
                <p className="text-sm text-slate-400 mt-1">
                  How sure: {(agent.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg border ${getScoreBgColor(agent.score)}`}>
              <div className={`text-2xl font-bold ${getScoreColor(agent.score)}`}>{agent.score}</div>
              <div className="text-xs text-slate-400">/ 100</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Certainty bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">How sure</span>
              <span className="text-emerald-400">{(agent.confidence * 100).toFixed(0)}%</span>
            </div>
            <Progress value={agent.confidence * 100} className="h-2" />
          </div>

          {/* Reasoning */}
          <div>
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

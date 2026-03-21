import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Verdict, DissentLevel } from "../data/mockData";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

interface VerdictCardProps {
  verdict: Verdict;
  dissentLevel: DissentLevel;
  dissentScore: number;
  entityName: string;
}

export function VerdictCard({ verdict, dissentLevel, dissentScore, entityName }: VerdictCardProps) {
  const getVerdictConfig = (v: Verdict) => {
    switch (v) {
      case "IMPROVING":
        return {
          color: "text-emerald-400",
          bgColor: "bg-emerald-500/10 border-emerald-500/30",
          icon: TrendingUp,
          description: "Positive trajectory across multiple sustainability dimensions",
        };
      case "DECLINING":
        return {
          color: "text-red-400",
          bgColor: "bg-red-500/10 border-red-500/30",
          icon: TrendingDown,
          description: "Negative trajectory indicating worsening sustainability conditions",
        };
      case "CONTESTED":
        return {
          color: "text-amber-400",
          bgColor: "bg-amber-500/10 border-amber-500/30",
          icon: AlertTriangle,
          description: "Agents disagree sharply on direction - both improvement and decline are defensible",
        };
      case "STAGNANT":
        return {
          color: "text-slate-400",
          bgColor: "bg-slate-500/10 border-slate-500/30",
          icon: Minus,
          description: "Minimal change across sustainability metrics",
        };
    }
  };

  const getDissentColor = (level: DissentLevel) => {
    switch (level) {
      case "HIGH":
        return "border-red-500/30 text-red-400";
      case "MODERATE":
        return "border-amber-500/30 text-amber-400";
      case "LOW":
        return "border-emerald-500/30 text-emerald-400";
    }
  };

  const config = getVerdictConfig(verdict);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`border-2 ${config.bgColor} bg-slate-900/50`}>
        <CardHeader>
          <CardTitle className="text-white text-xl">Trajectory Verdict</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Verdict */}
          <div className="text-center py-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Icon className={`h-12 w-12 ${config.color}`} />
              <div className={`text-6xl font-bold ${config.color}`}>{verdict}</div>
            </div>
            <p className="text-slate-300 text-lg">{entityName}</p>
            <p className="text-slate-400 mt-2">{config.description}</p>
          </div>

          {/* Dissent Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Dissent Score</span>
              <Badge variant="outline" className={getDissentColor(dissentLevel)}>
                {dissentLevel} DISSENT
              </Badge>
            </div>

            <div className="relative h-8 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${dissentScore * 100}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className={`h-full ${
                  dissentLevel === "HIGH"
                    ? "bg-gradient-to-r from-red-500 to-red-600"
                    : dissentLevel === "MODERATE"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600"
                      : "bg-gradient-to-r from-emerald-500 to-emerald-600"
                }`}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{(dissentScore * 100).toFixed(0)}%</span>
              </div>
            </div>

            <p className="text-sm text-slate-400">
              {dissentLevel === "HIGH"
                ? "The verdict is fragile—agents disagree on fundamental assumptions. Investigate contested dimensions before making decisions."
                : dissentLevel === "MODERATE"
                  ? "Moderate disagreement across agents. Some dimensions show clear consensus, others are contested."
                  : "The committee converged—the verdict is robust with strong agent consensus."}
            </p>
          </div>

          {/* Key Insight */}
          <div className="border-t border-slate-700 pt-4">
            <p className="text-xs text-slate-500 italic">
              This dissent score quantifies uncertainty—something no other ESG or urban analytics tool produces. High
              dissent is actionable information: it tells you exactly where to investigate further.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

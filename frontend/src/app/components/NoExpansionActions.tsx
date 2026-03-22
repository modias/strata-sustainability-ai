import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle2, Clock, TrendingDown, DollarSign } from "lucide-react";

interface NoExpansionActionsProps {
  actions: {
    action: string;
    timeframe: string;
    carbonImpact: string;
    cost: string;
  }[];
}

export function NoExpansionActions({ actions }: NoExpansionActionsProps) {
  const getTimeframeColor = (timeframe: string) => {
    if (timeframe.includes("90 days")) return "border-emerald-500/30 text-emerald-400";
    if (timeframe.includes("6 months")) return "border-amber-500/30 text-amber-400";
    return "border-blue-500/30 text-blue-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border-emerald-500/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-white text-xl">No-Expansion Action List</CardTitle>
              <p className="text-sm text-emerald-300 mt-2">
                Zero capex • Zero new headcount • Zero facility changes
              </p>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Immediately Actionable
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Actions List */}
          {actions.map((action, i) => (
            <div
              key={i}
              className="bg-slate-900/50 rounded-lg p-5 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-emerald-400 font-bold text-sm">{i + 1}</span>
                </div>
                <p className="text-slate-200 font-medium leading-relaxed">{action.action}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pl-11">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Timeframe</p>
                    <Badge variant="outline" className={getTimeframeColor(action.timeframe)}>
                      {action.timeframe}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-xs text-slate-500">Carbon Impact</p>
                    <p className="text-sm text-emerald-400 font-medium">{action.carbonImpact}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Cost</p>
                    <p className="text-sm text-slate-300 font-medium">{action.cost}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Value Proposition */}
          <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-emerald-500/20">
            <h4 className="text-sm font-semibold text-emerald-300 mb-2">Why these actions</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Most sustainability consultants recommend investment. STRATA tells you what to do{" "}
              <strong className="text-slate-300">without spending anything</strong>. Each action is filtered by a
              single prompt constraint—no capex above $50k, no new headcount, no facility changes—and ranked by carbon
              impact per dollar of implementation cost. This is the output that makes corporate mode immediately useful
              rather than advisory.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

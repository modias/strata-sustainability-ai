import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

export type RadarChartDatum = {
  dimension: string;
  score: number;
  fullMark: number;
  /** Committee agent name (matches Performance Radar axes). */
  agentHeading: string;
  /** Short label for polar ticks. */
  angleLabel?: string;
};

interface RadarChartProps {
  data: RadarChartDatum[];
}

export function RadarChart({ data }: RadarChartProps) {
  const chartRows = data.map((d) => ({
    ...d,
    angleLabel:
      d.angleLabel?.trim() ||
      d.dimension.replace(/^\d+\.\s*/, "").trim() ||
      d.dimension,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="bg-slate-900/50 border-slate-800 h-full">
        <CardHeader>
          <CardTitle className="text-white text-xl">Performance Radar</CardTitle>
          <p className="text-sm text-slate-400">
            One score per committee agent — values match each agent&apos;s average score in the Multi-Agent Review.
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RechartsRadar data={chartRows}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="angleLabel" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RechartsRadar>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {chartRows.map((item, index) => (
              <div
                key={`radar-legend-${index}-${item.agentHeading}`}
                className="flex items-center justify-between gap-2 p-2 rounded bg-slate-800/50"
              >
                <span className="text-sm font-semibold text-white leading-tight truncate min-w-0">
                  {item.agentHeading}
                </span>
                <span className="text-sm font-semibold text-emerald-400 shrink-0 tabular-nums">{item.score}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

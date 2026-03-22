import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

interface RadarChartProps {
  data: {
    dimension: string;
    score: number;
    fullMark: number;
  }[];
}

export function RadarChart({ data }: RadarChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="bg-slate-900/50 border-slate-800 h-full">
        <CardHeader>
          <CardTitle className="text-white text-xl">Performance Radar</CardTitle>
          <p className="text-sm text-slate-400">Multi-dimensional sustainability scoring</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RechartsRadar data={data}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="dimension" tick={{ fill: "#94a3b8", fontSize: 12 }} />
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

          {/* Score Legend */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {data.map((item, index) => (
              <div
                key={`radar-legend-${index}-${item.dimension}`}
                className="flex items-center justify-between p-2 rounded bg-slate-800/50"
              >
                <span className="text-sm text-slate-300">{item.dimension}</span>
                <span className="text-sm font-semibold text-emerald-400">{item.score}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

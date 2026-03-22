import { useEffect, useState } from "react";
import { format } from "date-fns";
import { History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export type VerdictHistoryRow = {
  verdict: string;
  final_score: number;
  trajectory: string;
  dissent_score: number;
  created_at: string;
};

function verdictColorClass(verdict: string): string {
  switch (verdict) {
    case "IMPROVING":
      return "text-emerald-400 font-semibold";
    case "DECLINING":
      return "text-red-400 font-semibold";
    case "CONTESTED":
    case "STAGNANT":
      return "text-amber-400 font-semibold";
    default:
      return "text-[var(--foreground)] font-semibold";
  }
}

interface VerdictHistoryProps {
  entityId: string;
}

export function VerdictHistory({ entityId }: VerdictHistoryProps) {
  const [rows, setRows] = useState<VerdictHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) {
      setRows([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const url = `${API_BASE}/history?entity_id=${encodeURIComponent(entityId)}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: VerdictHistoryRow[]) => {
        if (!cancelled && Array.isArray(data)) {
          setRows(data.slice(0, 5));
        }
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [entityId]);

  return (
    <Card className="bg-slate-900/50 border-slate-800 h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
            <History className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <CardTitle className="text-white text-lg">Analysis History</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Past verdicts from Snowflake</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-[var(--muted-foreground)]">Loading history…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No previous analyses</p>
        ) : (
          <ul className="space-y-0 divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden">
            {rows.map((row, i) => {
              const date =
                row.created_at != null
                  ? (() => {
                      try {
                        return format(new Date(row.created_at), "MMM d, yyyy");
                      } catch {
                        return String(row.created_at);
                      }
                    })()
                  : "—";
              const score =
                typeof row.final_score === "number" ? row.final_score : Number(row.final_score);
              return (
                <li
                  key={`${row.created_at}-${i}`}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-4 py-3 bg-slate-950/30"
                >
                  <span className="text-sm text-[var(--muted-foreground)] tabular-nums">{date}</span>
                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <span className={verdictColorClass(row.verdict)}>{row.verdict}</span>
                    <span className="text-sm text-[var(--foreground)] tabular-nums">
                      {Number.isFinite(score) ? score.toFixed(2) : "—"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

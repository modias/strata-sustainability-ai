import * as React from "react";
import { Link } from "react-router";
import { Layers } from "lucide-react";
import { cn } from "./ui/utils";
import { ENTITIES, type Entity } from "../data/mockData";

export type EntityListVariant = "corporate" | "hubs";

export function StrataEntityListPage(props: {
  title: string;
  entityIds: readonly string[];
  itemHref: (e: Entity) => string;
  descriptions: Record<string, string>;
  defaultDescription?: string;
  variant?: EntityListVariant;
  /** Rendered first inside the main content container (e.g. back link). */
  topContent?: React.ReactNode;
}) {
  const {
    title,
    entityIds,
    itemHref,
    descriptions,
    defaultDescription = "Corporate sustainability analysis",
    variant = "corporate",
    topContent,
  } = props;
  const hubs = variant === "hubs";

  const items = React.useMemo(
    () =>
      entityIds
        .map((id) => ENTITIES.find((e) => e.id === id))
        .filter((e): e is Entity => e != null)
        .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" })),
    [entityIds]
  );

  const hubDefaultDescription = "Urban sustainability analysis";

  return (
    <div className={cn("min-h-screen flex flex-col", hubs && "bg-[#0a0c14]")}>
      <header
        className={cn(
          "sticky top-0 z-50 border-b backdrop-blur-sm",
          hubs ? "border-[#1e293b] bg-[#0a0c14]/90" : "border-slate-800 bg-slate-950/50"
        )}
      >
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">STRATA</h1>
              <p className="text-xs text-slate-400">{title}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 flex-1 max-w-5xl w-full">
        {topContent}
        <h1 className="text-lg font-semibold text-white mb-6">{title}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((entity) => {
            const desc =
              descriptions[entity.id] ?? (hubs ? hubDefaultDescription : defaultDescription);
            return (
              <Link
                key={entity.id}
                to={itemHref(entity)}
                className={cn(
                  "block p-6 rounded-2xl border border-white/8 bg-white/3 transition-all group hover:bg-white/5",
                  hubs ? "hover:border-cyan-400/20" : "hover:border-emerald-400/20"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-white font-semibold text-lg mb-1">{entity.name}</div>
                    <div className="text-white/30 text-xs leading-relaxed">{desc}</div>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-mono px-2 py-1 rounded-full border shrink-0 ml-2",
                      hubs
                        ? "border-cyan-400/25 text-cyan-400/70"
                        : "border-emerald-400/20 text-emerald-400/60"
                    )}
                  >
                    {hubs ? "City Hub" : "Corporate"}
                  </span>
                </div>
                <div
                  className={cn(
                    "text-sm font-mono group-hover:translate-x-1 transition-transform mt-4",
                    hubs ? "text-cyan-400" : "text-emerald-400"
                  )}
                >
                  Analyze →
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

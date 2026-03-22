import * as React from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Layers } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { ENTITIES, type Entity } from "../data/mockData";

export function StrataEntityListPage(props: {
  title: string;
  entityIds: readonly string[];
  itemHref: (e: Entity) => string;
  actionLabel: string;
  variant?: "default" | "hubs";
}) {
  const { title, entityIds, itemHref, actionLabel, variant = "default" } = props;
  const navigate = useNavigate();
  const hubs = variant === "hubs";

  const items = React.useMemo(
    () =>
      entityIds
        .map((id) => ENTITIES.find((e) => e.id === id))
        .filter((e): e is Entity => e != null)
        .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" })),
    [entityIds]
  );

  return (
    <div className={cn("min-h-screen flex flex-col", hubs && "bg-[#0a0c14]")}>
      <header
        className={cn(
          "sticky top-0 z-50 border-b backdrop-blur-sm",
          hubs ? "border-[#1e293b] bg-[#0a0c14]/90" : "border-slate-800 bg-slate-950/50"
        )}
      >
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-slate-400 hover:text-white -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
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
        <h2 className="text-lg font-semibold text-white mb-6">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((entity) => (
            <button
              key={entity.id}
              type="button"
              onClick={() => navigate(itemHref(entity))}
              className={cn(
                "group text-left flex flex-col justify-between shadow-sm transition-colors",
                hubs
                  ? "rounded-2xl border border-[#1e293b] bg-[#0f1419] px-8 py-8 min-h-[128px] hover:border-emerald-500/35 hover:bg-[#121a24]"
                  : "rounded-xl border border-slate-700/80 bg-slate-950/60 p-6 min-h-[148px] hover:border-emerald-500/40 hover:bg-slate-900/50"
              )}
            >
              <span className={cn("font-semibold text-white pr-2", hubs && "leading-snug")}>{entity.name}</span>
              <span
                className={cn(
                  "self-end text-sm font-medium mt-6",
                  hubs ? "text-[#34d399] group-hover:text-[#6ee7b7]" : "text-emerald-400 group-hover:text-emerald-300"
                )}
              >
                {actionLabel}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

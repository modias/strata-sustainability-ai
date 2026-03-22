/**
 * Maps radar metric labels to committee role headings aligned with backend agents:
 * environmental.py, momentum.py, risk.py, social.py, and devil's advocate / synthesis rows.
 */

export const AGENT_HEADING_ENVIRONMENTAL = "Environmental Agent";
export const AGENT_HEADING_SOCIAL = "Social Agent";
export const AGENT_HEADING_RISK = "Risk Agent";
export const AGENT_HEADING_MOMENTUM = "Momentum Agent";
/** Synthesis / challenge role (overall trajectory, committee verdict context). */
export const AGENT_HEADING_DEVILS_ADVOCATE = "Devil's Advocate Agent";

/** Same canonical order as backend `main.py` `_AGENT_RESULT_ORDER`. */
export const CANONICAL_AGENT_KEYS = ["Environmental", "Social", "Risk", "Momentum"] as const;

function stripIndexPrefix(dimension: string): string {
  return dimension.replace(/^\d+\.\s*/, "").trim();
}

/** Whether this axis is the overall / judge synthesis (not one of the four scoring agents). */
export function isJudgeRadarRow(dimension: string): boolean {
  const d = stripIndexPrefix(dimension).toLowerCase();
  if (/\boverall\b/.test(d) && /\btrajectory\b/.test(d)) return true;
  if (/\b(synthesis|committee score|final verdict|strata verdict)\b/i.test(d)) return true;
  return false;
}

/**
 * Map a radar dimension label to the correct agent / judge heading.
 * Uses keyword routing so mock metrics (e.g. "Energy Systems", "Carbon Accounting") map to Environmental Agent.
 */
export function headingForRadarDimension(dimension: string): string {
  const raw = stripIndexPrefix(dimension);
  const d = raw.toLowerCase();

  if (isJudgeRadarRow(dimension)) {
    return AGENT_HEADING_DEVILS_ADVOCATE;
  }

  // Literal backend-style names (API / streamed cards)
  if (/^environmental(\s+agent)?$/i.test(raw)) return AGENT_HEADING_ENVIRONMENTAL;
  if (/^social(\s+agent)?$/i.test(raw)) return AGENT_HEADING_SOCIAL;
  if (/^risk(\s+agent)?$/i.test(raw)) return AGENT_HEADING_RISK;
  if (/^momentum(\s+agent)?$/i.test(raw)) return AGENT_HEADING_MOMENTUM;
  if (/^judge$/i.test(raw.trim())) return AGENT_HEADING_DEVILS_ADVOCATE;
  if (/^devil'?s advocate(\s+agent)?$/i.test(raw.trim())) return AGENT_HEADING_DEVILS_ADVOCATE;

  // Risk (check before "regulatory" overlaps with other copy)
  if (
    /^risk$/i.test(raw.trim()) ||
    /\b(risk agent|material risk|regulatory compliance|regulatory\b|compliance\b|litigation|stranded|sec climate|csrd|sb\s*253)\b/i.test(
      raw
    )
  ) {
    return AGENT_HEADING_RISK;
  }

  // Environmental — emissions, energy, land, climate snapshot metrics
  if (
    /\b(climate|energy|carbon|emissions|green|ndvi|heat|air quality|environmental|vegetation|flood|scope\s*[123]|renewable|solar|water intensity|green space|urban heat|footprint chronicles)\b/i.test(
      raw
    ) ||
    /\bclimate resilience\b/i.test(raw)
  ) {
    return AGENT_HEADING_ENVIRONMENTAL;
  }

  // Momentum — direction / pace (not "overall trajectory", handled above)
  if (/\b(momentum|direction of|pace of change|accelerat|velocity|rate of change)\b/i.test(raw)) {
    return AGENT_HEADING_MOMENTUM;
  }

  // Social — people, place, equity
  if (
    /\b(social|equity|public health|housing|displacement|afford|tenant|walkability|urban development|development quality|equity\s*&\s*access|development\b)\b/i.test(
      raw
    )
  ) {
    return AGENT_HEADING_SOCIAL;
  }

  // Corporate "Operations" in mocks — operational sustainability / footprint lens → environmental
  if (/\b(operations|operational|circularity|material circularity)\b/i.test(raw)) {
    return AGENT_HEADING_ENVIRONMENTAL;
  }

  return AGENT_HEADING_ENVIRONMENTAL;
}

export function radarMetricSubtitle(dimension: string, agentHeading: string): string | null {
  const d = stripIndexPrefix(dimension);
  if (!d) return null;
  if (d.toLowerCase() === agentHeading.toLowerCase()) return null;
  return d;
}

/**
 * Committee card title + optional lens line (mock uses lens labels like "Energy systems";
 * live API uses canonical names like "Environmental Agent").
 */
export function getAgentCardHeadings(
  agentName: string,
  committeeRole?: string,
  metricLens?: string
): { role: string; lens: string | null } {
  const role = committeeRole ?? headingForRadarDimension(agentName);
  const lens = metricLens ?? radarMetricSubtitle(agentName, role);
  return { role, lens };
}

import type { RiskLevel } from "@/lib/actra";

/**
 * Mirrors the thresholds used by the "Actra - Workflow 2: Deadline Risk Engine"
 * n8n workflow so on-demand recalculation and the 12-hour batch run agree.
 */
export function riskForDeadline(
  deadline: string | null | undefined,
  now: Date = new Date(),
): { risk: RiskLevel; reason: string } {
  if (!deadline) {
    return { risk: "LOW", reason: "No deadline detected in the source notice." };
  }
  const due = new Date(deadline);
  if (Number.isNaN(due.getTime())) {
    return { risk: "LOW", reason: "Deadline could not be parsed from the notice." };
  }
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 2) return { risk: "CRITICAL", reason: "Less than 48 hours to deadline." };
  if (diffDays <= 5)
    return {
      risk: "HIGH",
      reason: "Deadline within 5 days. Dependencies must be cleared immediately.",
    };
  if (diffDays <= 10) return { risk: "MEDIUM", reason: "Approaching deadline within 10 days." };
  return { risk: "LOW", reason: "Sufficient time remaining." };
}

export function sectionForRisk(risk: RiskLevel, actionable: boolean): "do_today" | "coming_up" | "fyi" {
  if (!actionable) return "fyi";
  return risk === "CRITICAL" || risk === "HIGH" ? "do_today" : "coming_up";
}

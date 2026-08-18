import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActraProfile } from "@/lib/actra";
import { riskForDeadline, sectionForRisk } from "@/lib/risk";
import { extractFromSources, notifyRiskWebhook, type IngestSource } from "@/lib/ingest.server";

type Client = SupabaseClient<any, any, any>;

interface ActionRow {
  id: string;
  title: string;
  deadline: string | null;
  status: string;
  section: string;
  risk_level: string;
  risk_explanation: string;
  blocked_by: string | null;
  blocked_by_label: string | null;
  position: number;
  document_id: string | null;
  category: string;
  relevance_score: number;
  relevance_reason: string;
  source_quote: string;
}

function newId(): string {
  return crypto.randomUUID();
}

function normalize(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export async function runIngest(
  supabase: Client,
  userId: string,
  sources: IngestSource[],
  profile: ActraProfile,
) {
  const { data: existing } = await supabase
    .from("actions")
    .select("id, title, status, position")
    .neq("status", "completed");

  const known = (existing ?? []) as { id: string; title: string; position: number }[];
  const extracted = await extractFromSources(sources, profile, known.map((a) => a.title));

  let position = known.reduce((max, a) => Math.max(max, a.position ?? 0), 0) + 10;

  const documentRows: Record<string, unknown>[] = [];
  const actionRows: Record<string, unknown>[] = [];
  const pendingBlockers: { id: string; blockedByTitle: string }[] = [];

  for (const doc of extracted) {
    const documentId = newId();
    documentRows.push({
      id: documentId,
      user_id: userId,
      title: doc.title,
      file_type: doc.fileType,
      raw_text: doc.rawText,
      status: "processed",
    });

    for (const a of doc.actions) {
      const id = newId();
      actionRows.push({
        id,
        user_id: userId,
        document_id: documentId,
        title: a.title,
        category: a.category,
        relevance_score: a.relevanceScore,
        relevance_reason: a.relevanceReason,
        deadline: a.deadline,
        risk_level: a.riskLevel,
        risk_explanation: a.riskExplanation,
        source_quote: a.sourceQuote,
        section: a.section,
        status: "pending",
        blocked_by: null,
        blocked_by_label: a.blockedByTitle,
        position: position++,
      });
      if (a.blockedByTitle) pendingBlockers.push({ id, blockedByTitle: a.blockedByTitle });
    }
  }

  if (documentRows.length) {
    const { error } = await supabase.from("documents").insert(documentRows);
    if (error) throw new Error(`Could not save the document: ${error.message}`);
  }

  if (actionRows.length) {
    const { error } = await supabase.from("actions").insert(actionRows);
    if (error) throw new Error(`Could not save the extracted actions: ${error.message}`);
  }

  // Resolve cross-document dependencies against every action this user owns.
  if (pendingBlockers.length) {
    const { data: all } = await supabase.from("actions").select("id, title");
    const index = new Map<string, string>();
    for (const row of (all ?? []) as { id: string; title: string }[]) {
      index.set(normalize(row.title), row.id);
    }
    for (const link of pendingBlockers) {
      const target =
        index.get(normalize(link.blockedByTitle)) ??
        [...index.entries()].find(([t]) => t.includes(normalize(link.blockedByTitle)))?.[1];
      if (target && target !== link.id) {
        await supabase.from("actions").update({ blocked_by: target }).eq("id", link.id);
      }
    }
  }

  const insertedIds = actionRows.map((r) => r.id as string);
  const risk = await runRiskRecalculation(supabase, userId, insertedIds, "upload");

  return {
    documentIds: documentRows.map((d) => d.id as string),
    actionIds: insertedIds,
    actionCount: insertedIds.length,
    webhookNotified: risk.webhookNotified,
  };
}

export async function runRiskRecalculation(
  supabase: Client,
  userId: string,
  actionIds: string[] | null,
  source: string,
) {
  let query = supabase
    .from("actions")
    .select("id, title, deadline, status, section, risk_level, risk_explanation")
    .neq("status", "completed")
    .not("deadline", "is", null);

  if (actionIds && actionIds.length) query = query.in("id", actionIds);

  const { data, error } = await query;
  if (error) throw new Error(`Could not read open actions: ${error.message}`);

  const rows = (data ?? []) as Pick<
    ActionRow,
    "id" | "title" | "deadline" | "status" | "section" | "risk_level" | "risk_explanation"
  >[];

  const updated: {
    id: string;
    riskLevel: string;
    riskExplanation: string;
    section: string;
  }[] = [];

  for (const row of rows) {
    const { risk, reason } = riskForDeadline(row.deadline);
    const explanation = `${risk === "CRITICAL" ? "Critical" : risk === "HIGH" ? "High" : risk === "MEDIUM" ? "Medium" : "Low"} Risk: ${reason}`;
    const section = row.section === "fyi" ? "fyi" : sectionForRisk(risk, true);
    if (row.risk_level === risk && row.risk_explanation === explanation && row.section === section) continue;

    const { error: updateError } = await supabase
      .from("actions")
      .update({ risk_level: risk, risk_explanation: explanation, section })
      .eq("id", row.id);
    if (!updateError) updated.push({ id: row.id, riskLevel: risk, riskExplanation: explanation, section });
  }

  const webhookNotified = await notifyRiskWebhook({
    userId,
    actionIds: actionIds ?? rows.map((r) => r.id),
    source,
  });

  return { updated, webhookNotified };
}

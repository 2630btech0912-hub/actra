import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_action",
  title: "Create action",
  description: "Create a new action item for the signed-in user, with deadline, risk level and relevance details.",
  inputSchema: {
    title: z.string().trim().min(1).describe("Short action title."),
    category: z.string().trim().min(1).optional().describe("Category badge, e.g. Fees, Exams, Placements."),
    section: z.enum(["do_today", "coming_up", "fyi"]).optional().describe("Dashboard section. Defaults to coming_up."),
    deadline: z.string().trim().optional().describe("Deadline as an ISO date/time string."),
    risk_level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional().describe("Risk level. Defaults to LOW."),
    risk_explanation: z.string().trim().optional().describe("Why this risk level was assigned."),
    relevance_score: z.number().int().min(0).max(100).optional().describe("Relevance score 0-100."),
    relevance_reason: z.string().trim().optional().describe("Why this action is relevant to the user."),
    source_quote: z.string().trim().optional().describe("Verbatim snippet from the source notice."),
    document_id: z.string().uuid().optional().describe("Source document id, if any."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("actions")
      .insert({
        user_id: ctx.getUserId()!,
        title: input.title,
        category: input.category ?? "General",
        section: input.section ?? "coming_up",
        deadline: input.deadline ?? null,
        risk_level: input.risk_level ?? "LOW",
        risk_explanation: input.risk_explanation ?? "",
        relevance_score: input.relevance_score ?? 80,
        relevance_reason: input.relevance_reason ?? "",
        source_quote: input.source_quote ?? "",
        document_id: input.document_id ?? null,
        status: "pending",
        position: 0,
      })
      .select()
      .maybeSingle();
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { action: data } };
  },
});

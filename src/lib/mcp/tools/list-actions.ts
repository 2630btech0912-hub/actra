import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_actions",
  title: "List actions",
  description:
    "List the signed-in user's extracted actions, optionally filtered by section (do_today, coming_up, fyi), status or risk level.",
  inputSchema: {
    section: z.enum(["do_today", "coming_up", "fyi"]).optional().describe("Dashboard section filter."),
    status: z.enum(["pending", "in_progress", "completed"]).optional().describe("Task status filter."),
    risk_level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional().describe("Risk level filter."),
    limit: z.number().int().min(1).max(100).optional().describe("Max rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ section, status, risk_level, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("actions")
      .select("*")
      .order("position", { ascending: true })
      .limit(limit ?? 50);
    if (section) query = query.eq("section", section);
    if (status) query = query.eq("status", status);
    if (risk_level) query = query.eq("risk_level", risk_level);
    const { data, error } = await query;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : {
          content: [{ type: "text", text: JSON.stringify(data) }],
          structuredContent: { actions: data ?? [] },
        };
  },
});

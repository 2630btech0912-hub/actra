import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_documents",
  title: "List documents",
  description: "List the signed-in user's uploaded notices and documents, newest first.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Max rows to return (default 25)."),
    include_text: z.boolean().optional().describe("Include the full raw text of each document."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, include_text }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const columns = include_text ? "*" : "id,title,file_type,status,created_at";
    const { data, error } = await supabaseForUser(ctx)
      .from("documents")
      .select(columns)
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { documents: data ?? [] } };
  },
});

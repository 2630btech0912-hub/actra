import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "add_document",
  title: "Add document",
  description: "Store a notice or document (raw text) for the signed-in user so actions can be extracted from it.",
  inputSchema: {
    title: z.string().trim().min(1).describe("Document title."),
    raw_text: z.string().trim().min(1).describe("Full text content of the notice."),
    file_type: z.string().trim().optional().describe("Source type, e.g. text, pdf, png. Defaults to text."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, raw_text, file_type }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("documents")
      .insert({
        user_id: ctx.getUserId()!,
        title,
        raw_text,
        file_type: file_type ?? "text",
        status: "processed",
      })
      .select()
      .maybeSingle();
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { document: data } };
  },
});

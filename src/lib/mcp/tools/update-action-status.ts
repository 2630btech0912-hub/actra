import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_action_status",
  title: "Update action status",
  description: "Set an action's status to pending, in_progress or completed for the signed-in user.",
  inputSchema: {
    action_id: z.string().uuid().describe("The action's id."),
    status: z.enum(["pending", "in_progress", "completed"]).describe("New status."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ action_id, status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("actions")
      .update({ status })
      .eq("id", action_id)
      .select()
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "No action found with that id." }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { action: data } };
  },
});

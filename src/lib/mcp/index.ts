import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listActionsTool from "./tools/list-actions";
import createActionTool from "./tools/create-action";
import updateActionStatusTool from "./tools/update-action-status";
import listDocumentsTool from "./tools/list-documents";
import addDocumentTool from "./tools/add-document";
import getProfileTool from "./tools/get-profile";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "remix-of-daily-habit-tracker",
  title: "Remix of Daily Habit Tracker",
  version: "0.1.0",
  instructions:
    "Tools for Actra, an action intelligence platform that turns notices and documents into prioritized actions. Read and manage the signed-in user's actions, documents and academic profile.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listActionsTool,
    createActionTool,
    updateActionStatusTool,
    listDocumentsTool,
    addDocumentTool,
    getProfileTool,
  ],
});

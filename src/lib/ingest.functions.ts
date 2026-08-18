import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { IngestSource } from "@/lib/ingest.server";
import type { ActraProfile } from "@/lib/actra";

export interface IngestInput {
  sources: IngestSource[];
  profile: ActraProfile;
}

export const ingestDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: IngestInput) => {
    if (!input || !Array.isArray(input.sources) || input.sources.length === 0) {
      throw new Error("Nothing to analyze.");
    }
    if (input.sources.length > 6) throw new Error("Upload at most 6 documents at a time.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { runIngest } = await import("@/lib/pipeline.server");
    return runIngest(context.supabase, context.userId, data.sources, data.profile);
  });

export const recalculateRisk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { actionIds?: string[] } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    const { runRiskRecalculation } = await import("@/lib/pipeline.server");
    return runRiskRecalculation(context.supabase, context.userId, data.actionIds ?? null, "on_demand");
  });

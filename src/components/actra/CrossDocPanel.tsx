import { ArrowRight, FileText, Lock, Sparkles } from "lucide-react";

export function CrossDocPanel() {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-[15px] font-semibold tracking-tight">Cross-Document Intelligence</h2>
      </div>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Actra links deadlines across separate notices to find hidden blockers.
      </p>

      <div className="mt-5 flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
        <div className="flex-1 rounded-lg border border-warning/30 bg-warning/10 p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-warning">
            <FileText className="h-3.5 w-3.5" /> Notice B
          </div>
          <p className="mt-1.5 text-[14px] font-medium text-foreground">Fee Payment Due Aug 18</p>
          <p className="mt-1 text-[12px] text-muted-foreground">24h bank settlement window</p>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1 px-2">
          <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface-alt px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Lock className="h-3 w-3" /> Blocks
          </span>
          <ArrowRight className="h-4 w-4 rotate-90 text-muted-foreground lg:rotate-0" />
        </div>

        <div className="flex-1 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-destructive">
            <FileText className="h-3.5 w-3.5" /> Notice A
          </div>
          <p className="mt-1.5 text-[14px] font-medium text-foreground">Exam Registration Closes Aug 20</p>
          <p className="mt-1 text-[12px] text-muted-foreground">Rejected if dues are pending</p>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3.5">
        <p className="text-[11px] uppercase tracking-widest text-primary">Synthesized directive</p>
        <p className="mt-1 text-[15px] font-semibold tracking-tight text-foreground">
          PAY FEES BY AUGUST 18 TO UNLOCK EXAM REGISTRATION
        </p>
      </div>
    </section>
  );
}

import { Check, Loader2 } from "lucide-react";
import { PROCESSING_STEPS } from "@/lib/actra";

interface ProcessingStepperProps {
  open: boolean;
  currentStep: number;
  fileNames: string[];
  done: boolean;
  onClose: () => void;
}

export function ProcessingStepper({ open, currentStep, fileNames, done, onClose }: ProcessingStepperProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Action Intelligence</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">Processing {fileNames.length} item(s)</h2>
        <p className="mt-1 truncate text-[13px] text-muted-foreground">{fileNames.join(", ")}</p>

        <ol className="mt-6 space-y-3">
          {PROCESSING_STEPS.map((label, i) => {
            const state = i < currentStep ? "done" : i === currentStep ? "active" : "todo";
            return (
              <li key={label} className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                    state === "done"
                      ? "border-primary bg-primary text-primary-foreground"
                      : state === "active"
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  {state === "done" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : state === "active" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={`text-[13px] ${
                    state === "todo" ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>

        {done && (
          <button
            onClick={onClose}
            className="mt-6 w-full rounded-lg bg-primary py-2.5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            View extracted actions
          </button>
        )}
      </div>
    </div>
  );
}

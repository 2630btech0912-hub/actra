import { useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Info,
  Play,
  Quote,
  ShieldAlert,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  RISK_STYLES,
  daysUntil,
  formatDeadline,
  type ActionItem,
  type ActionStatus,
} from "@/lib/actra";

interface ActionCardProps {
  action: ActionItem;
  blocker?: ActionItem | null;
  onStatusChange: (id: string, status: ActionStatus) => void;
}

export function ActionCard({ action, blocker, onStatusChange }: ActionCardProps) {
  const [showQuote, setShowQuote] = useState(false);
  const days = daysUntil(action.deadline);
  const blocked = !!blocker && blocker.status !== "completed";
  const completed = action.status === "completed";

  return (
    <article
      className={`rounded-xl border bg-card p-5 transition-colors ${
        completed ? "border-primary/30 opacity-70" : "border-border hover:border-border/80"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3
            className={`text-[15px] font-medium leading-snug ${
              completed ? "text-muted-foreground line-through" : "text-foreground"
            }`}
          >
            {action.title}
          </h3>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
              {action.category}
            </span>

            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 rounded-md border border-info/30 bg-info/10 px-2 py-0.5 text-[11px] font-medium text-info transition-colors hover:bg-info/20">
                  <Info className="h-3 w-3" />
                  {action.relevanceScore}% relevant
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 text-[13px]">
                <p className="mb-1 font-medium text-foreground">Why this is relevant to you</p>
                <p className="text-muted-foreground">✓ {action.relevanceReason}</p>
              </PopoverContent>
            </Popover>

            <span
              className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${RISK_STYLES[action.riskLevel]}`}
            >
              {action.riskLevel}
            </span>

            <span className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              <CalendarClock className="h-3 w-3" />
              {formatDeadline(action.deadline)}
              {days !== null && (
                <span className={days <= 2 ? "text-destructive" : "text-muted-foreground"}>
                  {days < 0 ? " · overdue" : days === 0 ? " · today" : ` · in ${days}d`}
                </span>
              )}
            </span>
          </div>
        </div>

        {completed && (
          <span className="flex items-center gap-1 text-[12px] font-medium text-primary">
            <CheckCircle2 className="h-4 w-4" /> Completed
          </span>
        )}
        {action.status === "in_progress" && (
          <span className="flex items-center gap-1 text-[12px] font-medium text-warning">
            <Play className="h-3.5 w-3.5" /> In progress
          </span>
        )}
      </div>

      {blocked && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-[13px] text-warning">
          <AlertTriangle className="mt-px h-4 w-4 shrink-0" />
          <span>⚠️ Blocked by: {action.blockedByLabel ?? blocker?.title}</span>
        </div>
      )}

      {action.riskExplanation && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-[13px] text-muted-foreground">
          <ShieldAlert className="mt-px h-4 w-4 shrink-0 text-muted-foreground" />
          <span>{action.riskExplanation}</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => onStatusChange(action.id, "in_progress")}
          disabled={blocked || completed}
          className="rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start Task
        </button>
        <button
          onClick={() => onStatusChange(action.id, completed ? "pending" : "completed")}
          className="rounded-lg border border-border px-3.5 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-accent"
        >
          {completed ? "Reopen" : "Mark Completed"}
        </button>
        <button
          onClick={() => setShowQuote((v) => !v)}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <Quote className="h-3.5 w-3.5" />
          Source
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showQuote ? "rotate-180" : ""}`} />
        </button>
      </div>

      {showQuote && (
        <blockquote className="mt-3 border-l-2 border-primary/60 bg-surface-alt px-3 py-2.5 text-[13px] italic text-muted-foreground">
          {action.sourceQuote}
        </blockquote>
      )}
    </article>
  );
}

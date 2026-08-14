import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/actra/AppShell";
import { ActionCard } from "@/components/actra/ActionCard";
import { useActra } from "@/hooks/use-actra";
import type { ActionItem } from "@/lib/actra";

export const Route = createFileRoute("/actions")({
  component: ActionsPage,
  head: () => ({
    meta: [
      { title: "My Actions — Actra" },
      { name: "description", content: "Every extracted action in one list: filter by open, in progress, blocked or completed, with risk and dependency context." },
      { property: "og:title", content: "My Actions — Actra" },
      { property: "og:description", content: "Filter every extracted action by status, risk and dependency." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Filter = "all" | "open" | "in_progress" | "blocked" | "completed";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In progress" },
  { key: "blocked", label: "Blocked" },
  { key: "completed", label: "Completed" },
];

function ActionsPage() {
  const { ready, user, actions, profile, setStatus } = useActra();
  const [filter, setFilter] = useState<Filter>("all");

  const byId = new Map(actions.map((a) => [a.id, a]));
  const blockerFor = (a: ActionItem) => (a.blockedById ? (byId.get(a.blockedById) ?? null) : null);

  const visible = actions.filter((a) => {
    const blocker = blockerFor(a);
    const isBlocked = !!blocker && blocker.status !== "completed";
    if (filter === "open") return a.status === "pending";
    if (filter === "in_progress") return a.status === "in_progress";
    if (filter === "blocked") return isBlocked;
    if (filter === "completed") return a.status === "completed";
    return true;
  });

  return (
    <AppShell title="My Actions" subtitle="Every extracted task, ranked by risk" profile={profile} signedIn={!!user}>
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-lg border px-3 py-1.5 text-[13px] transition-colors ${
              filter === key
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!ready ? (
        <p className="text-[13px] text-muted-foreground">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-foreground">
          No actions in this view.
        </p>
      ) : (
        <div className="space-y-3">
          {visible
            .sort((a, b) => a.position - b.position)
            .map((a) => (
              <ActionCard key={a.id} action={a} blocker={blockerFor(a)} onStatusChange={setStatus} />
            ))}
        </div>
      )}
    </AppShell>
  );
}

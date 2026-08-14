import { createFileRoute } from "@tanstack/react-router";
import { AlertOctagon, CheckCircle2, Lock } from "lucide-react";
import { AppShell } from "@/components/actra/AppShell";
import { ActionCard } from "@/components/actra/ActionCard";
import { CrossDocPanel } from "@/components/actra/CrossDocPanel";
import { useActra } from "@/hooks/use-actra";
import type { ActionItem } from "@/lib/actra";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Action Intelligence Dashboard — Actra" },
      { name: "description", content: "See urgent actions, blocked dependencies and completed tasks extracted from your notices in one dark, focused dashboard." },
      { property: "og:title", content: "Action Intelligence Dashboard — Actra" },
      { property: "og:description", content: "Urgent actions, blocked dependencies and critical-path risk, extracted from your documents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function DashboardPage() {
  const { ready, user, actions, profile, setStatus } = useActra();

  const byId = new Map(actions.map((a) => [a.id, a]));
  const blockerFor = (a: ActionItem) => (a.blockedById ? (byId.get(a.blockedById) ?? null) : null);

  const open = actions.filter((a) => a.status !== "completed");
  const urgent = open.filter((a) => a.riskLevel === "HIGH" || a.riskLevel === "CRITICAL").length;
  const blocked = open.filter((a) => {
    const b = blockerFor(a);
    return !!b && b.status !== "completed";
  }).length;
  const completed = actions.filter((a) => a.status === "completed").length;

  const section = (name: ActionItem["section"]) =>
    actions.filter((a) => a.section === name).sort((a, b) => a.position - b.position);

  return (
    <AppShell
      title="Action Intelligence Dashboard"
      subtitle="Turn information into action"
      profile={profile}
      signedIn={!!user}
    >
      {!ready ? (
        <p className="text-[13px] text-muted-foreground">Loading your action graph…</p>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <Counter
              label="Urgent Actions"
              value={urgent}
              tone="border-destructive/30 bg-destructive/10 text-destructive"
              icon={<AlertOctagon className="h-4 w-4" />}
            />
            <Counter
              label="Blocked Dependencies"
              value={blocked}
              tone="border-warning/30 bg-warning/10 text-warning"
              icon={<Lock className="h-4 w-4" />}
            />
            <Counter
              label="Completed Tasks"
              value={completed}
              tone="border-primary/30 bg-primary/10 text-primary"
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
          </div>

          <CrossDocPanel />

          <Group
            title="Do Today"
            hint="Immediate high-risk actions"
            items={section("do_today")}
            blockerFor={blockerFor}
            onStatusChange={setStatus}
          />
          <Group
            title="Coming Up"
            hint="Scheduled tasks with dependencies mapped"
            items={section("coming_up")}
            blockerFor={blockerFor}
            onStatusChange={setStatus}
          />
          <Group
            title="FYI / Reference"
            hint="Non-actionable notices"
            items={section("fyi")}
            blockerFor={blockerFor}
            onStatusChange={setStatus}
          />
        </div>
      )}
    </AppShell>
  );
}

function Counter({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border p-5 ${tone}`}>
      <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function Group({
  title,
  hint,
  items,
  blockerFor,
  onStatusChange,
}: {
  title: string;
  hint: string;
  items: ActionItem[];
  blockerFor: (a: ActionItem) => ActionItem | null;
  onStatusChange: (id: string, status: ActionItem["status"]) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        <p className="text-[12px] text-muted-foreground">{hint}</p>
        <span className="ml-auto text-[12px] text-muted-foreground">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-[13px] text-muted-foreground">
          Nothing here yet.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <ActionCard key={a.id} action={a} blocker={blockerFor(a)} onStatusChange={onStatusChange} />
          ))}
        </div>
      )}
    </section>
  );
}

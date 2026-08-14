import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, GitBranch, ScanText, ShieldAlert, Zap } from "lucide-react";
import { CrossDocPanel } from "@/components/actra/CrossDocPanel";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Actra — Turn information into action" },
      { name: "description", content: "Actra is an action intelligence platform. Upload notices and circulars, and get deadline-aware actions, cross-document dependencies and critical-path risk." },
      { property: "og:title", content: "Actra — Turn information into action" },
      { property: "og:description", content: "Upload notices, get ranked actions with deadlines, dependencies and risk." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const FEATURES = [
  {
    icon: ScanText,
    title: "Read anything",
    body: "PDFs, screenshots or pasted text. Actra parses the notice and keeps the verbatim source quote attached to every action.",
  },
  {
    icon: GitBranch,
    title: "Link across documents",
    body: "Deadlines in one circular often gate another. Actra resolves those dependencies and flags what is blocked.",
  },
  {
    icon: ShieldAlert,
    title: "Score the risk",
    body: "Every action carries a LOW to CRITICAL risk badge with a plain-English explanation of why it is tight.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Actra</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link to="/login" className="rounded-lg px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <Link
            to="/dashboard"
            className="rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:opacity-90"
          >
            Open dashboard
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20">
        <section className="py-14 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[12px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Action Intelligence Platform
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Turn information into action.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] text-muted-foreground">
            Campus notices, fee circulars and exam schedules arrive as walls of text. Actra extracts what
            <em className="not-italic text-foreground"> you </em>
            must do, when it is due, and what blocks it.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-medium text-primary-foreground hover:opacity-90"
            >
              Upload a notice <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-[14px] font-medium hover:bg-accent"
            >
              See the dashboard
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5">
              <Icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-[15px] font-medium">{title}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>

        <section className="mt-6">
          <CrossDocPanel />
        </section>
      </main>
    </div>
  );
}

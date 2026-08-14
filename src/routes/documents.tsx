import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, ChevronDown } from "lucide-react";
import { AppShell } from "@/components/actra/AppShell";
import { useActra } from "@/hooks/use-actra";

export const Route = createFileRoute("/documents")({
  component: DocumentsPage,
  head: () => ({
    meta: [
      { title: "Documents — Actra" },
      { name: "description", content: "Every notice Actra has processed, with the verbatim source text and the actions extracted from it." },
      { property: "og:title", content: "Documents — Actra" },
      { property: "og:description", content: "Browse processed notices and the actions extracted from each one." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function DocumentsPage() {
  const { ready, user, documents, actions, profile } = useActra();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <AppShell title="Documents" subtitle="Processed notices and their source text" profile={profile} signedIn={!!user}>
      {!ready ? (
        <p className="text-[13px] text-muted-foreground">Loading…</p>
      ) : documents.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-foreground">
          No documents yet — upload a notice to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const linked = actions.filter((a) => a.documentId === doc.id);
            const open = openId === doc.id;
            return (
              <div key={doc.id} className="rounded-xl border border-border bg-card">
                <button
                  onClick={() => setOpenId(open ? null : doc.id)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left"
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{doc.title}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {doc.fileType.toUpperCase()} · {linked.length} action(s) ·{" "}
                      {new Date(doc.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                    {doc.status}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                </button>

                {open && (
                  <div className="border-t border-border px-5 py-4">
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Source text</p>
                    <p className="mt-2 whitespace-pre-wrap text-[13px] text-muted-foreground">{doc.rawText}</p>
                    {linked.length > 0 && (
                      <>
                        <p className="mt-4 text-[11px] uppercase tracking-widest text-muted-foreground">
                          Extracted actions
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {linked.map((a) => (
                            <li key={a.id} className="flex items-start gap-2 text-[13px]">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              <span>{a.title}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

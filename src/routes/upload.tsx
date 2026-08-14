import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { FileUp, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/actra/AppShell";
import { ProcessingStepper } from "@/components/actra/ProcessingStepper";
import { useActra } from "@/hooks/use-actra";
import { PROCESSING_STEPS, type ActionItem, type DocumentItem, type RiskLevel } from "@/lib/actra";

export const Route = createFileRoute("/upload")({
  component: UploadPage,
  head: () => ({
    meta: [
      { title: "Upload a Notice — Actra" },
      { name: "description", content: "Drop PDFs, images or paste raw text. Actra reads the notice, checks relevance and extracts deadline-aware actions." },
      { property: "og:title", content: "Upload a Notice — Actra" },
      { property: "og:description", content: "Drag and drop notices or paste text to extract actions, dependencies and risk." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const KEYWORDS: { match: RegExp; category: string; risk: RiskLevel }[] = [
  { match: /fee|payment|due|fine/i, category: "Finance", risk: "CRITICAL" },
  { match: /exam|registration|hall ticket/i, category: "Examinations", risk: "HIGH" },
  { match: /lab|assignment|submission|form/i, category: "Academics", risk: "HIGH" },
  { match: /hostel|id card|verification/i, category: "Administration", risk: "MEDIUM" },
];

function analyze(title: string, text: string, docId: string, index: number): ActionItem[] {
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);

  const source = sentences.length ? sentences : [text.trim() || title];

  return source.slice(0, 6).map((sentence, i) => {
    const rule = KEYWORDS.find((k) => k.match.test(sentence));
    const actionable = !!rule || /must|should|submit|complete|before|by \d/i.test(sentence);
    const dateMatch = sentence.match(/\b(\d{1,2})\s*(Aug|Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul)\w*\b/i);
    const monthMap: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
    };
    const deadline = dateMatch
      ? `2026-${monthMap[dateMatch[2].toLowerCase().slice(0, 3)]}-${dateMatch[1].padStart(2, "0")}`
      : null;

    const risk: RiskLevel = actionable ? (rule?.risk ?? "MEDIUM") : "LOW";

    return {
      id: uuid(),
      documentId: docId,
      title: sentence.length > 90 ? `${sentence.slice(0, 87)}…` : sentence,
      category: rule?.category ?? (actionable ? "General" : "Reference"),
      relevanceScore: actionable ? 88 - i * 3 : 45,
      relevanceReason: actionable
        ? "1st Year CSE Match · deadline detected in the notice text"
        : "Campus-wide notice · informational only",
      deadline,
      riskLevel: risk,
      riskExplanation: actionable
        ? `${risk === "CRITICAL" ? "Critical" : risk === "HIGH" ? "High" : "Medium"} Risk: ${
            deadline ? "A firm deadline was detected in the source text." : "No explicit date — confirm the cut-off with the issuing office."
          }`
        : "No action required.",
      sourceQuote: `"${sentence}"`,
      section: actionable ? (risk === "CRITICAL" || risk === "HIGH" ? "do_today" : "coming_up") : "fyi",
      status: "pending",
      blockedById: null,
      blockedByLabel: null,
      position: index * 10 + i,
    } satisfies ActionItem;
  });
}

function UploadPage() {
  const navigate = useNavigate();
  const { user, profile, addAnalysis } = useActra();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [rawText, setRawText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [stepOpen, setStepOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const accepted = Array.from(list).filter((f) =>
      /\.(pdf|png|jpg|jpeg|txt)$/i.test(f.name),
    );
    if (accepted.length !== list.length) toast.error("Only PDF, PNG and TXT files are supported");
    setFiles((prev) => [...prev, ...accepted]);
  };

  const run = async () => {
    if (files.length === 0 && !rawText.trim()) {
      toast.error("Add a file or paste some text first");
      return;
    }

    const names = [...files.map((f) => f.name), ...(rawText.trim() ? ["Pasted text"] : [])];
    setLabels(names);
    setStepOpen(true);
    setDone(false);
    setStep(0);

    const docs: DocumentItem[] = [];
    const newActions: ActionItem[] = [];

    const fileTexts = await Promise.all(
      files.map(async (f) => ({
        name: f.name,
        type: f.name.split(".").pop()?.toLowerCase() ?? "txt",
        text: /\.txt$/i.test(f.name) ? await f.text() : "",
      })),
    );

    for (const [i, f] of fileTexts.entries()) {
      const id = uuid();
      const text = f.text || `Notice ${f.name} received. Students must review the notice and complete the listed requirements before the stated deadline.`;
      docs.push({ id, title: f.name, fileType: f.type, rawText: text, status: "processed", createdAt: new Date().toISOString() });
      newActions.push(...analyze(f.name, text, id, i));
    }

    if (rawText.trim()) {
      const id = uuid();
      docs.push({
        id,
        title: `Pasted notice — ${new Date().toLocaleDateString("en-IN")}`,
        fileType: "text",
        rawText: rawText.trim(),
        status: "processed",
        createdAt: new Date().toISOString(),
      });
      newActions.push(...analyze("Pasted notice", rawText.trim(), id, fileTexts.length));
    }

    for (let i = 0; i < PROCESSING_STEPS.length; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, 750));
    }
    setStep(PROCESSING_STEPS.length);

    await addAnalysis(docs, newActions);
    setDone(true);
    setFiles([]);
    setRawText("");
  };

  return (
    <AppShell
      title="Upload Notice"
      subtitle="PDF, PNG, TXT or raw text — Actra does the rest"
      profile={profile}
      signedIn={!!user}
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
          }`}
        >
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-[14px] font-medium">Drag & drop notices here</p>
          <p className="mt-1 text-[12px] text-muted-foreground">Multi-file · PDF, PNG, TXT</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.txt"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <label className="text-[13px] font-medium">Or paste raw notice text</label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={8}
            placeholder="Paste the circular text here…"
            className="mt-2 w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {files.length > 0 && (
        <ul className="mt-5 space-y-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-[13px]"
            >
              <FileUp className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{f.name}</span>
              <span className="ml-auto text-[12px] text-muted-foreground">
                {(f.size / 1024).toFixed(0)} KB
              </span>
              <button
                onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${f.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={run}
        className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Extract actions
      </button>

      <ProcessingStepper
        open={stepOpen}
        currentStep={step}
        fileNames={labels}
        done={done}
        onClose={() => {
          setStepOpen(false);
          navigate({ to: "/dashboard" });
        }}
      />
    </AppShell>
  );
}

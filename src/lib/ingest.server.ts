import type { ActraProfile, RiskLevel } from "@/lib/actra";
import { riskForDeadline, sectionForRisk } from "@/lib/risk";

export interface IngestSource {
  /** Display title, usually the file name. */
  title: string;
  /** txt | text | pdf | png | jpg … */
  fileType: string;
  /** Plain text content when the client could read it. */
  text?: string;
  /** Base64 data URL for PDFs/images the model has to read itself. */
  dataUrl?: string;
}

export interface ExtractedAction {
  title: string;
  category: string;
  relevanceScore: number;
  relevanceReason: string;
  deadline: string | null;
  riskLevel: RiskLevel;
  riskExplanation: string;
  sourceQuote: string;
  section: "do_today" | "coming_up" | "fyi";
  blockedByTitle: string | null;
}

export interface ExtractedDocument {
  title: string;
  fileType: string;
  rawText: string;
  actions: ExtractedAction[];
}

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";
const RISKS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function systemPrompt(profile: ActraProfile, today: string): string {
  return [
    "You are Actra, an action-intelligence engine for university notices and circulars.",
    `Today is ${today}.`,
    `The reader is ${profile.displayName}, ${profile.year} ${profile.branch}${
      profile.specialization ? ` (${profile.specialization})` : ""
    }.`,
    "For each document you receive:",
    "1. Read it and reproduce the readable text.",
    "2. Decide whether it is relevant to this reader; score relevance 0-100 and explain the match in one short clause.",
    "3. Extract every concrete action the reader must take, with an explicit deadline in YYYY-MM-DD when one is stated or clearly implied.",
    "4. If an action cannot start until another action (in this batch or listed under KNOWN OPEN ACTIONS) is completed, set blockedByTitle to that other action's title verbatim. Otherwise null.",
    "5. Purely informational notices produce items with section 'fyi' and no deadline.",
    "Quote the exact sentence you extracted each action from in sourceQuote.",
    "Never invent deadlines, fees, or requirements that are not in the document.",
    "Reply with JSON only, no markdown fences.",
  ].join("\n");
}

const RESPONSE_SHAPE = `{
  "documents": [
    {
      "title": string,
      "rawText": string,
      "actions": [
        {
          "title": string,
          "category": string,
          "relevanceScore": number,
          "relevanceReason": string,
          "deadline": string | null,
          "riskExplanation": string,
          "sourceQuote": string,
          "section": "do_today" | "coming_up" | "fyi",
          "blockedByTitle": string | null
        }
      ]
    }
  ]
}`;

function clamp(n: unknown, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function normalizeDeadline(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[0] : null;
}

function stripFences(content: string): string {
  return content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "")
    .trim();
}

export async function extractFromSources(
  sources: IngestSource[],
  profile: ActraProfile,
  knownOpenActions: string[],
): Promise<ExtractedDocument[]> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const today = new Date().toISOString().slice(0, 10);

  const content: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: [
        `Return exactly ${sources.length} document object(s), in the same order as the inputs.`,
        knownOpenActions.length
          ? `KNOWN OPEN ACTIONS (already tracked, usable as blockers):\n- ${knownOpenActions.join("\n- ")}`
          : "KNOWN OPEN ACTIONS: none.",
        `Respond with this JSON shape:\n${RESPONSE_SHAPE}`,
      ].join("\n\n"),
    },
  ];

  sources.forEach((s, i) => {
    content.push({
      type: "text",
      text: `--- DOCUMENT ${i + 1} — title: ${s.title} (${s.fileType}) ---\n${
        s.text?.trim() ? s.text.trim().slice(0, 24000) : "(binary document attached below)"
      }`,
    });
    if (!s.text?.trim() && s.dataUrl) {
      content.push({ type: "image_url", image_url: { url: s.dataUrl } });
    }
  });

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt(profile, today) },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (res.status === 429) throw new Error("AI rate limit reached — try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
  if (!res.ok) throw new Error(`Document analysis failed (${res.status}).`);

  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = payload.choices?.[0]?.message?.content;
  if (!raw) throw new Error("The analyzer returned an empty response.");

  let parsed: { documents?: unknown };
  try {
    parsed = JSON.parse(stripFences(raw)) as { documents?: unknown };
  } catch {
    throw new Error("The analyzer returned a malformed response.");
  }

  const docs = Array.isArray(parsed.documents) ? parsed.documents : [];

  return sources.map((source, i) => {
    const doc = (docs[i] ?? {}) as Record<string, unknown>;
    const rawActions = Array.isArray(doc.actions) ? doc.actions : [];

    const actions: ExtractedAction[] = rawActions.map((entry) => {
      const a = (entry ?? {}) as Record<string, unknown>;
      const deadline = normalizeDeadline(a.deadline);
      const rawSection = typeof a.section === "string" ? a.section : "coming_up";
      const actionable = rawSection !== "fyi";
      const computed = riskForDeadline(deadline);
      const riskLevel: RiskLevel = actionable ? computed.risk : "LOW";
      const explanation =
        typeof a.riskExplanation === "string" && a.riskExplanation.trim()
          ? a.riskExplanation.trim()
          : computed.reason;

      return {
        title: String(a.title ?? "Untitled action").slice(0, 160),
        category: String(a.category ?? "General").slice(0, 40),
        relevanceScore: clamp(a.relevanceScore, actionable ? 80 : 40),
        relevanceReason: String(a.relevanceReason ?? "Extracted from the uploaded notice.").slice(0, 240),
        deadline,
        riskLevel: RISKS.includes(riskLevel) ? riskLevel : "LOW",
        riskExplanation: actionable
          ? `${riskLevel === "CRITICAL" ? "Critical" : riskLevel === "HIGH" ? "High" : riskLevel === "MEDIUM" ? "Medium" : "Low"} Risk: ${explanation}`
          : "No action required.",
        sourceQuote:
          typeof a.sourceQuote === "string" && a.sourceQuote.trim()
            ? `"${a.sourceQuote.trim().replace(/^"|"$/g, "")}"`
            : "",
        section: sectionForRisk(riskLevel, actionable),
        blockedByTitle:
          typeof a.blockedByTitle === "string" && a.blockedByTitle.trim()
            ? a.blockedByTitle.trim()
            : null,
      };
    });

    return {
      title: source.title,
      fileType: source.fileType,
      rawText:
        (typeof doc.rawText === "string" && doc.rawText.trim()) ||
        source.text?.trim() ||
        "(no readable text extracted)",
      actions,
    };
  });
}

/** Fire-and-forget notification to an external n8n webhook, when configured. */
export async function notifyRiskWebhook(payload: {
  userId: string;
  actionIds: string[];
  source: string;
}): Promise<boolean> {
  const url = process.env['N8N_RISK_WEBHOOK_URL'];
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, triggeredAt: new Date().toISOString() }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

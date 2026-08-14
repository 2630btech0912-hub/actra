export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ActionSection = "do_today" | "coming_up" | "fyi";
export type ActionStatus = "pending" | "in_progress" | "completed";

export interface ActionItem {
  id: string;
  documentId: string | null;
  title: string;
  category: string;
  relevanceScore: number;
  relevanceReason: string;
  deadline: string | null;
  riskLevel: RiskLevel;
  riskExplanation: string;
  sourceQuote: string;
  section: ActionSection;
  status: ActionStatus;
  blockedById: string | null;
  blockedByLabel: string | null;
  position: number;
}

export interface DocumentItem {
  id: string;
  title: string;
  fileType: string;
  rawText: string;
  status: string;
  createdAt: string;
}

export interface ActraProfile {
  displayName: string;
  year: string;
  branch: string;
  specialization: string;
}

export const DEFAULT_PROFILE: ActraProfile = {
  displayName: "Aditri",
  year: "1st Year",
  branch: "CSE",
  specialization: "Cyber Security",
};

export function profileTag(p: ActraProfile): string {
  const suffix = [p.year, p.branch].filter(Boolean).join(" ");
  const spec = p.specialization ? ` - ${p.specialization}` : "";
  return `${p.displayName} (${suffix}${spec})`;
}

export const RISK_STYLES: Record<RiskLevel, string> = {
  LOW: "border-primary/30 bg-primary/10 text-primary",
  MEDIUM: "border-warning/30 bg-warning/10 text-warning",
  HIGH: "border-warning/40 bg-warning/15 text-warning",
  CRITICAL: "border-destructive/40 bg-destructive/15 text-destructive",
};

export const PROCESSING_STEPS = [
  "Reading Document",
  "Checking Relevance",
  "Finding Actions",
  "Resolving Cross-Document Dependencies",
  "Calculating Critical Path Risk",
] as const;

/** Stable demo ids so cross-document dependencies resolve deterministically. */
export const DEMO_DOC_A = "11111111-1111-4111-8111-111111111111";
export const DEMO_DOC_B = "22222222-2222-4222-8222-222222222222";
export const DEMO_DOC_C = "33333333-3333-4333-8333-333333333333";

export const DEMO_ACTION_FEES = "aaaaaaa1-0000-4000-8000-000000000001";
export const DEMO_ACTION_EXAM = "aaaaaaa1-0000-4000-8000-000000000002";

export const DEMO_DOCUMENTS: DocumentItem[] = [
  {
    id: DEMO_DOC_B,
    title: "Notice B — Semester Fee Payment Circular",
    fileType: "pdf",
    rawText:
      "All students must clear semester fees through the online portal on or before 18 August. Payments are confirmed only after bank settlement, which may take up to 24 hours.",
    status: "processed",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: DEMO_DOC_A,
    title: "Notice A — Odd Semester Exam Registration",
    fileType: "pdf",
    rawText:
      "Exam registration for the odd semester closes at 11:59 PM on 20 August. Students with pending fee dues will not be able to submit the registration form.",
    status: "processed",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: DEMO_DOC_C,
    title: "Circular — Cyber Security Lab Kit & Campus Notices",
    fileType: "txt",
    rawText:
      "1st Year CSE (Cyber Security) students must submit the lab kit acknowledgement form. The library will remain closed on 24 August for stock verification.",
    status: "processed",
    createdAt: new Date().toISOString(),
  },
];

export const DEMO_ACTIONS: ActionItem[] = [
  {
    id: DEMO_ACTION_FEES,
    documentId: DEMO_DOC_B,
    title: "Pay Semester Fees on the student portal",
    category: "Finance",
    relevanceScore: 98,
    relevanceReason: "1st Year CSE Match · applies to all enrolled students · deadline within 4 days",
    deadline: "2026-08-18",
    riskLevel: "CRITICAL",
    riskExplanation:
      "High Risk: Fee clearance requires 24h bank settlement before portal closes Aug 18. Paying later than Aug 17 evening risks an unconfirmed payment.",
    sourceQuote:
      "\"All students must clear semester fees through the online portal on or before 18 August. Payments are confirmed only after bank settlement, which may take up to 24 hours.\"",
    section: "do_today",
    status: "pending",
    blockedById: null,
    blockedByLabel: null,
    position: 0,
  },
  {
    id: "aaaaaaa1-0000-4000-8000-000000000003",
    documentId: DEMO_DOC_C,
    title: "Submit Cyber Security lab kit acknowledgement form",
    category: "Academics",
    relevanceScore: 94,
    relevanceReason: "1st Year CSE Match · Cyber Security specialization named explicitly",
    deadline: "2026-08-16",
    riskLevel: "HIGH",
    riskExplanation:
      "High Risk: Form must be signed by the lab in-charge, who is available only on working days before 4 PM.",
    sourceQuote:
      "\"1st Year CSE (Cyber Security) students must submit the lab kit acknowledgement form.\"",
    section: "do_today",
    status: "pending",
    blockedById: null,
    blockedByLabel: null,
    position: 1,
  },
  {
    id: DEMO_ACTION_EXAM,
    documentId: DEMO_DOC_A,
    title: "Complete Odd Semester Exam Registration",
    category: "Examinations",
    relevanceScore: 97,
    relevanceReason: "1st Year CSE Match · registration mandatory for all first-year students",
    deadline: "2026-08-20",
    riskLevel: "CRITICAL",
    riskExplanation:
      "Critical: Registration form rejects students with pending dues, so the fee payment must settle first. Only a 2-day buffer exists between the two deadlines.",
    sourceQuote:
      "\"Exam registration for the odd semester closes at 11:59 PM on 20 August. Students with pending fee dues will not be able to submit the registration form.\"",
    section: "coming_up",
    status: "pending",
    blockedById: DEMO_ACTION_FEES,
    blockedByLabel: "Pay Semester Fees first",
    position: 2,
  },
  {
    id: "aaaaaaa1-0000-4000-8000-000000000004",
    documentId: DEMO_DOC_C,
    title: "Collect hostel ID re-verification sticker",
    category: "Administration",
    relevanceScore: 72,
    relevanceReason: "Hostel resident match · not specific to your branch",
    deadline: "2026-08-27",
    riskLevel: "MEDIUM",
    riskExplanation:
      "Medium Risk: Counter operates for 3 hours a day and queues peak in the final week.",
    sourceQuote: "\"Hostel residents should collect the re-verification sticker before 27 August.\"",
    section: "coming_up",
    status: "pending",
    blockedById: null,
    blockedByLabel: null,
    position: 3,
  },
  {
    id: "aaaaaaa1-0000-4000-8000-000000000005",
    documentId: DEMO_DOC_C,
    title: "Library closed on 24 August for stock verification",
    category: "Reference",
    relevanceScore: 40,
    relevanceReason: "Campus-wide notice · informational, no action required from you",
    deadline: null,
    riskLevel: "LOW",
    riskExplanation: "No action required. Plan any book returns around this date.",
    sourceQuote: "\"The library will remain closed on 24 August for stock verification.\"",
    section: "fyi",
    status: "pending",
    blockedById: null,
    blockedByLabel: null,
    position: 4,
  },
  {
    id: "aaaaaaa1-0000-4000-8000-000000000006",
    documentId: DEMO_DOC_A,
    title: "Read exam code-of-conduct annexure",
    category: "Reference",
    relevanceScore: 55,
    relevanceReason: "Attached to a notice that applies to you · informational",
    deadline: null,
    riskLevel: "LOW",
    riskExplanation: "No deadline attached. Useful context before the exam window.",
    sourceQuote: "\"Refer to Annexure II for the examination code of conduct.\"",
    section: "fyi",
    status: "pending",
    blockedById: null,
    blockedByLabel: null,
    position: 5,
  },
];

export function formatDeadline(date: string | null): string {
  if (!date) return "No deadline";
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const d = new Date(`${date}T00:00:00`).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d - today.getTime()) / 86400000);
}

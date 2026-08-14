import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  DEFAULT_PROFILE,
  DEMO_ACTIONS,
  DEMO_DOCUMENTS,
  type ActionItem,
  type ActionStatus,
  type ActraProfile,
  type DocumentItem,
} from "@/lib/actra";

const LS_ACTIONS = "actra_actions";
const LS_DOCS = "actra_documents";
const LS_PROFILE = "actra_profile";

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function rowToAction(row: any): ActionItem {
  return {
    id: row.id,
    documentId: row.document_id,
    title: row.title,
    category: row.category,
    relevanceScore: row.relevance_score,
    relevanceReason: row.relevance_reason,
    deadline: row.deadline,
    riskLevel: row.risk_level,
    riskExplanation: row.risk_explanation,
    sourceQuote: row.source_quote,
    section: row.section,
    status: row.status,
    blockedById: row.blocked_by,
    blockedByLabel: row.blocked_by_label,
    position: row.position ?? 0,
  };
}

function actionToRow(a: ActionItem, userId: string) {
  return {
    id: a.id,
    user_id: userId,
    document_id: a.documentId,
    title: a.title,
    category: a.category,
    relevance_score: a.relevanceScore,
    relevance_reason: a.relevanceReason,
    deadline: a.deadline,
    risk_level: a.riskLevel,
    risk_explanation: a.riskExplanation,
    source_quote: a.sourceQuote,
    section: a.section,
    status: a.status,
    blocked_by: a.blockedById,
    blocked_by_label: a.blockedByLabel,
    position: a.position,
  };
}

async function getSupabase() {
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase;
}

export interface ActraStore {
  ready: boolean;
  user: User | null;
  actions: ActionItem[];
  documents: DocumentItem[];
  profile: ActraProfile;
  setStatus: (id: string, status: ActionStatus) => Promise<void>;
  addAnalysis: (docs: DocumentItem[], actions: ActionItem[]) => Promise<void>;
  saveProfile: (p: ActraProfile) => Promise<void>;
  resetDemo: () => Promise<void>;
}

export function useActra(): ActraStore {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [profile, setProfile] = useState<ActraProfile>(DEFAULT_PROFILE);

  const loadLocal = useCallback(() => {
    setActions(readLocal<ActionItem[]>(LS_ACTIONS, DEMO_ACTIONS));
    setDocuments(readLocal<DocumentItem[]>(LS_DOCS, DEMO_DOCUMENTS));
    setProfile(readLocal<ActraProfile>(LS_PROFILE, DEFAULT_PROFILE));
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = await getSupabase();
        const { data } = await supabase.auth.getUser();
        const u = data.user ?? null;
        if (cancelled) return;
        setUser(u);

        if (!u) {
          loadLocal();
          setReady(true);
          return;
        }

        const [{ data: docRows }, { data: actionRows }, { data: profileRow }] = await Promise.all([
          supabase.from("documents").select("*").order("created_at", { ascending: false }),
          supabase.from("actions").select("*").order("position", { ascending: true }),
          supabase.from("profiles").select("*").eq("id", u.id).maybeSingle(),
        ]);

        if (cancelled) return;

        if (!actionRows || actionRows.length === 0) {
          // First run: seed the demo intelligence set for this account.
          await supabase.from("documents").upsert(
            DEMO_DOCUMENTS.map((d) => ({
              id: d.id,
              user_id: u.id,
              title: d.title,
              file_type: d.fileType,
              raw_text: d.rawText,
              status: d.status,
            })),
          );
          const seeded = DEMO_ACTIONS.map((a) => actionToRow(a, u.id));
          await supabase.from("actions").upsert(seeded.map(({ blocked_by, ...rest }) => rest));
          await supabase.from("actions").upsert(seeded);
          setDocuments(DEMO_DOCUMENTS);
          setActions(DEMO_ACTIONS);
        } else {
          setActions(actionRows.map(rowToAction));
          setDocuments(
            (docRows ?? []).map((r: any) => ({
              id: r.id,
              title: r.title,
              fileType: r.file_type,
              rawText: r.raw_text,
              status: r.status,
              createdAt: r.created_at,
            })),
          );
        }

        setProfile({
          displayName: profileRow?.display_name || DEFAULT_PROFILE.displayName,
          year: (profileRow as any)?.year || DEFAULT_PROFILE.year,
          branch: (profileRow as any)?.branch || DEFAULT_PROFILE.branch,
          specialization: (profileRow as any)?.specialization || DEFAULT_PROFILE.specialization,
        });
      } catch {
        if (!cancelled) loadLocal();
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadLocal]);

  const persistLocalActions = useCallback((next: ActionItem[]) => {
    setActions(next);
    writeLocal(LS_ACTIONS, next);
  }, []);

  const setStatus = useCallback(
    async (id: string, status: ActionStatus) => {
      const next = actions.map((a) => (a.id === id ? { ...a, status } : a));
      setActions(next);
      if (user) {
        const supabase = await getSupabase();
        await supabase.from("actions").update({ status }).eq("id", id);
      } else {
        writeLocal(LS_ACTIONS, next);
      }
    },
    [actions, user],
  );

  const addAnalysis = useCallback(
    async (docs: DocumentItem[], newActions: ActionItem[]) => {
      const nextDocs = [...docs, ...documents];
      const nextActions = [...newActions, ...actions];
      setDocuments(nextDocs);
      setActions(nextActions);

      if (user) {
        const supabase = await getSupabase();
        await supabase.from("documents").insert(
          docs.map((d) => ({
            id: d.id,
            user_id: user.id,
            title: d.title,
            file_type: d.fileType,
            raw_text: d.rawText,
            status: d.status,
          })),
        );
        await supabase.from("actions").insert(newActions.map((a) => actionToRow(a, user.id)));
      } else {
        writeLocal(LS_DOCS, nextDocs);
        writeLocal(LS_ACTIONS, nextActions);
      }
    },
    [actions, documents, user],
  );

  const saveProfile = useCallback(
    async (p: ActraProfile) => {
      setProfile(p);
      if (user) {
        const supabase = await getSupabase();
        await supabase.from("profiles").upsert({
          id: user.id,
          display_name: p.displayName,
          year: p.year,
          branch: p.branch,
          specialization: p.specialization,
        } as any);
      } else {
        writeLocal(LS_PROFILE, p);
      }
    },
    [user],
  );

  const resetDemo = useCallback(async () => {
    if (user) {
      const supabase = await getSupabase();
      await supabase.from("actions").delete().eq("user_id", user.id);
      await supabase.from("documents").delete().eq("user_id", user.id);
      await supabase.from("documents").insert(
        DEMO_DOCUMENTS.map((d) => ({
          id: d.id,
          user_id: user.id,
          title: d.title,
          file_type: d.fileType,
          raw_text: d.rawText,
          status: d.status,
        })),
      );
      const rows = DEMO_ACTIONS.map((a) => actionToRow(a, user.id));
      await supabase.from("actions").insert(rows.map(({ blocked_by, ...rest }) => rest));
      for (const row of rows.filter((r) => r.blocked_by)) {
        await supabase.from("actions").update({ blocked_by: row.blocked_by }).eq("id", row.id);
      }
    } else {
      writeLocal(LS_DOCS, DEMO_DOCUMENTS);
      writeLocal(LS_ACTIONS, DEMO_ACTIONS);
    }
    setDocuments(DEMO_DOCUMENTS);
    persistLocalActions(DEMO_ACTIONS);
  }, [persistLocalActions, user]);

  return { ready, user, actions, documents, profile, setStatus, addAnalysis, saveProfile, resetDemo };
}

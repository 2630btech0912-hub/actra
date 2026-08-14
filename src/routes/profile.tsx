import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/actra/AppShell";
import { useActra } from "@/hooks/use-actra";
import { profileTag, type ActraProfile } from "@/lib/actra";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Profile — Actra" },
      { name: "description", content: "Set your year, branch and specialization so Actra can score how relevant each notice is to you." },
      { property: "og:title", content: "Profile — Actra" },
      { property: "og:description", content: "Tune relevance scoring with your academic profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ProfilePage() {
  const { ready, user, profile, saveProfile, resetDemo } = useActra();
  const [draft, setDraft] = useState<ActraProfile>(profile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ready) setDraft(profile);
  }, [ready, profile]);

  const save = async () => {
    setSaving(true);
    try {
      await saveProfile(draft);
      toast.success("Profile updated — relevance scoring recalibrated");
    } catch {
      toast.error("Could not save your profile");
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof ActraProfile, placeholder: string) => (
    <div>
      <label className="text-[13px] text-muted-foreground">{label}</label>
      <input
        value={draft[key]}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );

  return (
    <AppShell title="Profile" subtitle="Drives relevance scoring across every notice" profile={profile} signedIn={!!user}>
      <div className="max-w-lg space-y-5">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Active profile tag</p>
          <p className="mt-1.5 text-[15px] font-medium">{profileTag(profile)}</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {user ? "Synced to your account" : "Stored on this device — sign in to sync"}
          </p>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          {field("Name", "displayName", "Aditri")}
          {field("Year", "year", "1st Year")}
          {field("Branch", "branch", "CSE")}
          {field("Specialization", "specialization", "Cyber Security")}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
            <button
              onClick={async () => {
                await resetDemo();
                toast.success("Demo intelligence set restored");
              }}
              className="rounded-lg border border-border px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-accent"
            >
              Reset demo data
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

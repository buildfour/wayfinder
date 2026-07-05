"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Wordmark } from "@/components/layout/Wordmark";
import { FilmPerforations } from "@/components/layout/FilmPerforations";
import { StarChartGrid } from "@/components/layout/StarChart";
import { LoadingPulse } from "@/components/motion/LoadingPulse";
import {
  connectUserSource,
  fetchUserSettings,
  updateUserSettings,
} from "@/lib/user/client";
import { useWinnieStore } from "@/store/winnie-store";

const navItems = [
  { id: "account", label: "MY ACCOUNT" },
  { id: "sources", label: "CONNECTED SOURCES" },
  { id: "team", label: "TEAM MEMBERS" },
  { id: "notifications", label: "NOTIFICATIONS" },
];

const settingFields = [
  { key: "showCheckpoints", label: "Show checkpoints" },
  { key: "autoBranchByOS", label: "Auto-branch by OS" },
  { key: "showTimeEstimates", label: "Show time estimates" },
  { key: "notifyOnSourceChange", label: "When source doc changes" },
] as const;

const sourceIcons: Record<string, string> = {
  notion: "N",
  "google-drive": "G",
  confluence: "C",
};

export default function SettingsPage() {
  const router = useRouter();
  const { status } = useSession();
  const voiceEnabled = useWinnieStore((s) => s.voiceEnabled);
  const setVoiceEnabled = useWinnieStore((s) => s.setVoiceEnabled);
  const [activeNav, setActiveNav] = useState("account");
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("");
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [sources, setSources] = useState<
    Array<{ id: string; provider: string; label: string; status: string }>
  >([]);
  const [teamMembers, setTeamMembers] = useState<
    Array<{ id: string; email: string; role: string; status: string }>
  >([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status !== "authenticated") return;

    void (async () => {
      const data = await fetchUserSettings();
      if (!data.success) return;

      setName(data.user?.name ?? "");
      setEmail(data.user?.email ?? "");
      setPlan(data.user?.plan ?? "explorer");
      setSources(data.connectedSources ?? []);
      setTeamMembers(data.teamMembers ?? []);

      if (data.settings) {
        setToggles({
          showCheckpoints: data.settings.showCheckpoints,
          autoBranchByOS: data.settings.autoBranchByOS,
          showTimeEstimates: data.settings.showTimeEstimates,
          notifyOnSourceChange: data.settings.notifyOnSourceChange,
        });
      }
      setLoading(false);
    })();
  }, [status, router]);

  const handleToggle = async (key: string) => {
    const next = !toggles[key];
    setToggles((t) => ({ ...t, [key]: next }));
    await updateUserSettings({ [key]: next });
  };

  const handleConnectSource = async (provider: string) => {
    const result = await connectUserSource(provider);
    if (result.success && result.source) {
      setSources((prev) => [...prev, result.source]);
    }
  };

  if (status === "loading" || loading) {
    return <LoadingPulse label="Loading settings…" />;
  }

  return (
    <div className="relative min-h-screen bg-void film-grain">
      <StarChartGrid className="opacity-30" />
      <div className="flex min-h-screen">
        <aside className="flex w-56 shrink-0 flex-col border-r border-parchment/10 px-6 py-8">
          <Wordmark className="mb-12" />
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                className={`relative w-full py-3 text-left font-[family-name:var(--font-bebas)] text-xs tracking-[0.15em] ${
                  activeNav === item.id ? "text-amber" : "text-muted"
                }`}
              >
                {activeNav === item.id && (
                  <span className="absolute -left-6 top-1/2 h-4 w-0.5 -translate-y-1/2 bg-amber" />
                )}
                {item.label}
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-auto pt-20 font-[family-name:var(--font-bebas)] text-xs tracking-[0.15em] text-red-400/70 hover:text-red-400"
          >
            SIGN OUT
          </button>
        </aside>

        <main className="flex-1 px-8 py-8 md:px-16">
          {activeNav === "account" && (
            <>
              <section className="mb-16">
                <h2 className="mb-8 font-[family-name:var(--font-bebas)] text-xs tracking-[0.25em] text-teal">
                  ABOUT US
                </h2>
                <div className="max-w-md space-y-6">
                  <label className="block border-b border-parchment/10 pb-3">
                    <span className="block text-[10px] tracking-wider text-muted">NAME</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => updateUserSettings({ name })}
                      className="mt-1 w-full bg-transparent text-parchment focus:outline-none"
                    />
                  </label>
                  {[
                    { label: "EMAIL", value: email },
                    {
                      label: "PLAN",
                      value: `${plan.charAt(0).toUpperCase()}${plan.slice(1)} Tier (Unlimited Tours)`,
                    },
                  ].map((field) => (
                    <div key={field.label} className="border-b border-parchment/10 pb-3">
                      <span className="block text-[10px] tracking-wider text-muted">
                        {field.label}
                      </span>
                      <span className="mt-1 block text-parchment">{field.value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mb-16">
                <h2 className="mb-8 font-[family-name:var(--font-bebas)] text-xs tracking-[0.25em] text-teal">
                  SETTINGS
                </h2>
                <div className="max-w-lg space-y-0">
                  {settingFields.map((setting) => (
                    <div
                      key={setting.key}
                      className="flex items-center justify-between border-b border-parchment/10 py-4"
                    >
                      <span className="text-sm text-parchment/80">{setting.label}</span>
                      <button
                        type="button"
                        onClick={() => handleToggle(setting.key)}
                        className={`relative h-5 w-10 rounded-full transition-colors ${
                          toggles[setting.key] ? "bg-teal" : "bg-parchment/20"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                            toggles[setting.key] ? "left-5" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-b border-parchment/10 py-4">
                    <div>
                      <span className="text-sm text-parchment/80">Voice-guided tours</span>
                      <p className="mt-1 text-[10px] text-muted">
                        Winnie narrates steps via Gradium (tour player + chat)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className={`relative h-5 w-10 rounded-full transition-colors ${
                        voiceEnabled ? "bg-teal" : "bg-parchment/20"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                          voiceEnabled ? "left-5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeNav === "sources" && (
            <section>
              <h2 className="mb-8 font-[family-name:var(--font-bebas)] text-xs tracking-[0.25em] text-teal">
                CONNECTED SOURCES
              </h2>
              <div className="mb-8 flex gap-4">
                {sources.length === 0 ? (
                  <p className="text-sm text-muted">No sources connected yet.</p>
                ) : (
                  sources.map((source) => (
                    <div
                      key={source.id}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-teal/30 bg-charcoal/50 text-sm text-teal"
                      title={source.label}
                    >
                      {sourceIcons[source.provider] ?? source.provider[0]?.toUpperCase()}
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-3">
                {["notion", "google-drive", "confluence"].map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => handleConnectSource(provider)}
                    className="rounded border border-parchment/15 px-4 py-2 text-xs tracking-wider text-muted hover:border-teal/30 hover:text-teal"
                  >
                    Connect {provider}
                  </button>
                ))}
              </div>
            </section>
          )}

          {activeNav === "team" && (
            <section>
              <h2 className="mb-8 font-[family-name:var(--font-bebas)] text-xs tracking-[0.25em] text-teal">
                TEAM MEMBERS
              </h2>
              {teamMembers.length === 0 ? (
                <p className="text-sm text-muted">No team members yet.</p>
              ) : (
                <ul className="space-y-3">
                  {teamMembers.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between border-b border-parchment/10 py-3 text-sm"
                    >
                      <span>{member.email}</span>
                      <span className="text-muted">
                        {member.role} · {member.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {activeNav === "notifications" && (
            <section>
              <h2 className="mb-8 font-[family-name:var(--font-bebas)] text-xs tracking-[0.25em] text-teal">
                NOTIFICATIONS
              </h2>
              <p className="text-sm text-muted">
                Source-change alerts are{" "}
                {toggles.notifyOnSourceChange ? "enabled" : "disabled"}. Toggle in Settings
                under My Account.
              </p>
            </section>
          )}

          {activeNav === "account" && (
            <section>
              <p className="font-[family-name:var(--font-bebas)] text-[10px] tracking-[0.2em] text-red-400/50">
                DELETE ACCOUNT
              </p>
              <p className="mt-2 text-xs text-muted">
                Contact support to delete your account.
              </p>
            </section>
          )}
        </main>
      </div>

      <div className="absolute bottom-6 left-6">
        <Link href="/dashboard" className="text-xs text-muted hover:text-teal">
          ← Dashboard
        </Link>
      </div>

      <FilmPerforations className="absolute bottom-0 left-0 right-0" />
    </div>
  );
}

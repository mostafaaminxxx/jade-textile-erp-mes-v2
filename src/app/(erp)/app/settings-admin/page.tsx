import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  KeyRound,
  ServerCog,
  ShieldCheck,
  TestTube2,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { ProfileStatusPanel } from "@/components/auth/ProfileStatusPanel";
import { DataConnectionGate } from "@/components/layout/DataConnectionGate";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import {
  getAuthProfileReadinessData,
  getDatabaseReadinessChecklist,
} from "@/lib/data/factory";

export const dynamic = "force-dynamic";

export default async function SettingsAdminPage() {
  const [checklist, profileReadiness] = await Promise.all([
    getDatabaseReadinessChecklist(),
    getAuthProfileReadinessData(),
  ]);
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local";

  return (
    <>
      <SectionHeader
        eyebrow="Settings / Admin"
        title="Environment and database readiness"
        description="Operational setup status for the V2 shell. Service role keys must stay backend/admin only and are never shown in frontend code."
      />

      <DataConnectionGate result={checklist}>
        {(data) => (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
            <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-jade-ink">Connection status</h2>
              <div className="mt-5 space-y-3 text-sm">
                <StatusRow
                  label="Supabase client"
                  value={data.supabaseConfigured ? "Configured" : "Supabase connection required."}
                  ok={data.supabaseConfigured}
                  icon={<Database className="h-4 w-4" aria-hidden="true" />}
                />
                <StatusRow
                  label="Project URL"
                  value={data.projectUrl || "Supabase connection required."}
                  ok={data.env.hasUrl}
                  icon={<ServerCog className="h-4 w-4" aria-hidden="true" />}
                />
                <StatusRow
                  label="Anon key variable"
                  value={data.env.hasAnonKey ? "Present, value hidden" : "Missing"}
                  ok={data.env.hasAnonKey}
                  icon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
                />
                <StatusRow
                  label="Environment"
                  value={environment}
                  ok
                  icon={<ServerCog className="h-4 w-4" aria-hidden="true" />}
                />
                <StatusRow
                  label="Service role"
                  value="Backend/admin only, not exposed"
                  ok={!data.env.exposesServiceRole}
                  icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                />
              </div>
            </section>

            <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-jade-ink">Database readiness checklist</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.items.map((item) => (
                  <div key={item.label} className="rounded-md border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-bold text-jade-ink">{item.label}</p>
                      <StatusChip status={item.status} />
                    </div>
                    <p className="mt-2 text-2xl font-black text-jade-ink">
                      {item.count ?? "-"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-jade-steel">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </section>
            </div>

            <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-jade-ink">Auth & Profile Readiness</h2>
              <p className="mt-1 text-sm font-semibold text-jade-steel">
                Assignment writes require a real signed-in user with an active profile role.
              </p>
              <DataConnectionGate result={profileReadiness}>
                {(profileData) => (
                  <div className="mt-5 space-y-5">
                    {profileData.profilesTotal === 0 ? (
                      <div className="rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-900">
                        No profiles exist yet. Create the first admin/planning profile in Supabase before testing assignments.
                      </div>
                    ) : null}
                    <div className="grid gap-3 md:grid-cols-3">
                      <ReadinessMetric
                        label="profiles_total"
                        value={profileData.profilesTotal}
                      />
                      <ReadinessMetric
                        label="active_profiles"
                        value={profileData.activeProfiles}
                      />
                      <ReadinessMetric
                        label="assignment_allowed_profiles"
                        value={profileData.assignmentAllowedProfiles}
                      />
                    </div>
                    <ProfileStatusPanel compact />
                  </div>
                )}
              </DataConnectionGate>
            </section>

            <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-jade-panel text-jade-blue">
                    <TestTube2 className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-jade-ink">
                      Preview & Controlled Test Center
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-jade-steel">
                      Review environment, auth/profile readiness, and controlled assignment testing.
                    </p>
                  </div>
                </div>
                <Link
                  href="/app/settings-admin/preview-test-center"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-jade-blue px-4 py-3 text-sm font-black text-white transition hover:bg-blue-800"
                >
                  Open Preview Test Center
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </section>
          </div>
        )}
      </DataConnectionGate>
    </>
  );
}

function ReadinessMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
      <p className="text-2xl font-black text-jade-ink">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase text-jade-steel">{label}</p>
    </div>
  );
}

function StatusRow({
  label,
  value,
  ok,
  icon,
}: {
  label: string;
  value: string;
  ok: boolean;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-slate-100 p-3">
      <div className="flex gap-2">
        <span className="mt-0.5 text-jade-blue">{icon}</span>
        <div>
          <p className="font-bold text-jade-ink">{label}</p>
          <p className="mt-1 break-all text-jade-steel">{value}</p>
        </div>
      </div>
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-jade-blue" aria-hidden="true" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-orange-700" aria-hidden="true" />
      )}
    </div>
  );
}

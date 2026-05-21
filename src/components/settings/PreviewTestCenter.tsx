"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clipboard,
  Database,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { ProfileStatusPanel } from "@/components/auth/ProfileStatusPanel";
import { getMyProfileClient, type MyProfileStatus } from "@/lib/data/profile-client";
import { cn } from "@/lib/utils";
import type { PreviewTestCenterData } from "@/types/factory";

export function PreviewTestCenter({
  data,
  firstAdminSql,
  rollbackSql,
}: {
  data: PreviewTestCenterData;
  firstAdminSql: string;
  rollbackSql: string;
}) {
  const [profileStatus, setProfileStatus] = useState<MyProfileStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const result = await getMyProfileClient();

      if (!cancelled) {
        setProfileStatus(result);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const checklist = [
    {
      label: "Supabase connected",
      ready: data.readiness.supabaseConnected,
      detail: data.readiness.supabaseConnected
        ? "Public client configuration is present."
        : "Supabase connection required.",
    },
    {
      label: "User signed in",
      ready: Boolean(profileStatus?.user),
      detail: profileStatus?.user?.email ?? "No active browser session.",
    },
    {
      label: "Profile exists",
      ready: Boolean(profileStatus?.profile),
      detail: profileStatus?.profile
        ? "Profile row is visible for the signed-in user."
        : "Profile row is missing or no user is signed in.",
    },
    {
      label: "Role is ADMIN/MANAGER/PLANNING",
      ready: Boolean(profileStatus?.assignmentAllowed),
      detail: profileStatus?.profile?.role ?? "Waiting for assignment-ready role.",
    },
    {
      label: "At least one real line exists",
      ready: data.readiness.hasRealLines,
      detail: `${data.databaseCounts.productionLines} production_lines rows.`,
    },
    {
      label: "At least one real order exists",
      ready: data.readiness.hasRealOrders,
      detail: `${data.databaseCounts.orders} orders rows.`,
    },
    {
      label: "Assignment RPC available",
      ready: data.readiness.assignmentRpcConfigured,
      detail: "Configured as public.assign_line_order_context.",
    },
    {
      label: "line_order_contexts current count",
      ready: data.databaseCounts.lineOrderContexts > 0,
      warningOnly: true,
      detail: `${data.databaseCounts.lineOrderContexts} active/test contexts in database.`,
    },
    {
      label: "Feed fields protected",
      ready: data.readiness.feedFieldsProtected,
      detail: "Controlled assignment does not update feed_percent or feed_cover_days.",
    },
  ];

  return (
    <div className="space-y-6">
      {data.warnings.length > 0 ? (
        <section className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm font-semibold leading-6 text-orange-900">
          {data.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReadinessCard
          label="Supabase"
          ready={data.environment.supabaseConfigured}
          value={data.environment.supabaseConfigured ? "Configured" : "Required"}
        />
        <ReadinessCard
          label="Project URL"
          ready={data.environment.hasProjectUrl}
          value={data.environment.hasProjectUrl ? "Present" : "Missing"}
        />
        <ReadinessCard
          label="Anon key"
          ready={data.environment.hasAnonKey}
          value={data.environment.hasAnonKey ? "Present, hidden" : "Missing"}
        />
        <ReadinessCard
          label="Service role"
          ready={!data.environment.exposesServiceRole}
          value="Never shown"
        />
      </section>

      <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
        <SectionTitle
          title="Database foundation readiness"
          subtitle="Real Supabase counts only. Zero means the database currently has zero rows."
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <CountTile label="customers" value={data.databaseCounts.customers} />
          <CountTile label="production_groups" value={data.databaseCounts.productionGroups} />
          <CountTile label="production_lines" value={data.databaseCounts.productionLines} />
          <CountTile label="style_master" value={data.databaseCounts.styleMaster} />
          <CountTile label="orders" value={data.databaseCounts.orders} />
          <CountTile label="production_plans" value={data.databaseCounts.productionPlans} />
          <CountTile label="material_readiness" value={data.databaseCounts.materialReadiness} />
          <CountTile label="wip_readiness" value={data.databaseCounts.wipReadiness} />
          <CountTile label="profiles" value={data.databaseCounts.profiles} />
          <CountTile
            label="assignment_allowed_profiles"
            value={data.databaseCounts.assignmentAllowedProfiles}
          />
          <CountTile
            label="line_order_contexts"
            value={data.databaseCounts.lineOrderContexts}
          />
          <CountTile
            label="line_current_state_with_context"
            value={data.databaseCounts.lineCurrentStateWithContext}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
          <SectionTitle
            title="Controlled assignment test checklist"
            subtitle="The button stays useful for navigation, while these checks explain whether the first assignment test is safe to run."
          />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {checklist.map((item) => (
              <ChecklistItem key={item.label} {...item} />
            ))}
          </div>
          <Link
            href="/app/orders-planning/line-assignment"
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-jade-blue px-4 py-3 text-sm font-black text-white transition hover:bg-blue-800"
          >
            Open Line Assignment Center
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <ProfileStatusPanel compact />
      </section>

      <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
        <SectionTitle
          title="First admin setup guidance"
          subtitle="Copy this template into Supabase SQL Editor after replacing the placeholder with a real auth user id."
        />
        {data.databaseCounts.profiles === 0 ? (
          <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-900">
            First admin profile is required before assignment testing.
          </div>
        ) : null}
        <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-3 text-sm">
          <p className="font-bold text-jade-ink">Signed-in auth user id</p>
          <p className="mt-1 break-all font-mono text-xs text-jade-steel">
            {profileStatus?.user?.id ?? "Sign in from /login to see your auth user id."}
          </p>
        </div>
        <CopyableSqlBlock title="First admin profile SQL" sql={firstAdminSql} />
      </section>

      <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
        <SectionTitle
          title="Rollback guidance"
          subtitle="This template is for manual rollback only. The app does not run rollback SQL."
        />
        <CopyableSqlBlock title="Controlled assignment rollback SQL" sql={rollbackSql} />
      </section>
    </div>
  );
}

function ReadinessCard({
  label,
  value,
  ready,
}: {
  label: string;
  value: string;
  ready: boolean;
}) {
  return (
    <div className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-jade-steel">{label}</p>
          <p className="mt-2 text-lg font-black text-jade-ink">{value}</p>
        </div>
        {ready ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-700" aria-hidden="true" />
        ) : (
          <ShieldAlert className="h-5 w-5 text-orange-700" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

function CountTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
      <p className="text-2xl font-black text-jade-ink">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase text-jade-steel">{label}</p>
    </div>
  );
}

function ChecklistItem({
  label,
  ready,
  detail,
  warningOnly,
}: {
  label: string;
  ready: boolean;
  detail: string;
  warningOnly?: boolean;
}) {
  const icon =
    ready || warningOnly ? (
      <CheckCircle2
        className={cn("h-5 w-5", ready ? "text-emerald-700" : "text-orange-700")}
        aria-hidden="true"
      />
    ) : (
      <XCircle className="h-5 w-5 text-red-700" aria-hidden="true" />
    );

  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-jade-ink">{label}</p>
          <p className="mt-1 text-sm leading-6 text-jade-steel">{detail}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function CopyableSqlBlock({ title, sql }: { title: string; sql: string }) {
  const [copied, setCopied] = useState(false);

  async function copySql() {
    if (!navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(sql);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-jade-blue" aria-hidden="true" />
          <h3 className="text-sm font-black text-jade-ink">{title}</h3>
        </div>
        <button
          type="button"
          onClick={copySql}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-jade-line px-3 py-2 text-xs font-black text-jade-ink"
        >
          <Clipboard className="h-4 w-4" aria-hidden="true" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-96 overflow-auto bg-slate-950 p-4 text-xs leading-6 text-slate-100">
        <code>{sql}</code>
      </pre>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-jade-ink">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-jade-steel">{subtitle}</p>
    </div>
  );
}

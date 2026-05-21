"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, ShieldAlert, UserRound } from "lucide-react";
import { getMyProfileClient, type MyProfileStatus } from "@/lib/data/profile-client";
import { cn } from "@/lib/utils";

export function ProfileStatusPanel({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [status, setStatus] = useState<MyProfileStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadProfile() {
    setIsLoading(true);
    const result = await getMyProfileClient();
    setStatus(result);
    setIsLoading(false);
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const assignmentAllowed = status?.assignmentAllowed ?? false;

  return (
    <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-jade-panel text-jade-blue">
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-jade-ink">Profile status</h2>
            <p className="mt-1 text-sm font-semibold text-jade-steel">
              Auth user and role readiness for operational writes.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadProfile}
          className="rounded-md border border-jade-line p-2 text-jade-steel hover:text-jade-ink"
          aria-label="Refresh profile status"
        >
          <RefreshCw
            className={cn("h-4 w-4", isLoading && "animate-spin")}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className={cn("mt-5 grid gap-3", compact ? "sm:grid-cols-2" : "md:grid-cols-2")}>
        <StatusItem label="Signed-in email" value={status?.user?.email ?? "Not signed in"} />
        <StatusItem label="Auth user id" value={status?.user?.id ?? "Not available"} mono />
        <StatusItem
          label="Profile row"
          value={status?.profile ? "Exists" : "Missing"}
        />
        <StatusItem
          label="Full name"
          value={status?.profile?.fullName ?? "Waiting"}
        />
        <StatusItem label="Role" value={status?.profile?.role ?? "Waiting"} />
        <StatusItem
          label="Active"
          value={
            status?.profile?.isActive === true
              ? "Active"
              : status?.profile?.isActive === false
                ? "Inactive"
                : "Waiting"
          }
        />
      </div>

      <div
        className={cn(
          "mt-5 flex items-start gap-3 rounded-md border px-4 py-3 text-sm font-semibold leading-6",
          assignmentAllowed
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-orange-200 bg-orange-50 text-orange-900",
        )}
      >
        {assignmentAllowed ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <div>
          <p>Assignment permission: {assignmentAllowed ? "Yes" : "No"}</p>
          <p className="mt-1">{isLoading ? "Checking profile status." : status?.message}</p>
        </div>
      </div>
    </section>
  );
}

function StatusItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-black uppercase text-jade-steel">{label}</p>
      <p
        className={cn(
          "mt-1 break-all text-sm font-bold text-jade-ink",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </p>
    </div>
  );
}

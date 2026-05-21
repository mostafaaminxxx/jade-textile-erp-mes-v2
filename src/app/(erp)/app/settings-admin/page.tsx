import { CheckCircle2, Database, ServerCog, ShieldCheck, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const foundationTables = [
  "profiles",
  "customers",
  "customer_aliases",
  "customer_color_rules",
  "production_groups",
  "production_lines",
  "factory_group_layouts",
  "style_master",
  "orders",
  "order_items",
  "production_plans",
  "production_plan_daily_quantities",
  "order_operation_routes",
  "line_order_contexts",
  "line_current_state",
  "material_readiness",
  "fabric_stock_items",
  "cut_panel_wip",
  "wip_readiness",
  "import_batches",
  "source_files",
  "raw_import_rows",
  "import_conflicts",
  "fabric_stock_import_rows",
  "cut_panel_import_rows",
  "audit_logs",
];

export default function SettingsAdminPage() {
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local";

  return (
    <>
      <SectionHeader
        eyebrow="Settings / Admin"
        title="Environment and database readiness"
        description="Operational setup status for the V2 shell. Service role keys must stay backend/admin only."
      />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-jade-ink">Connection status</h2>
          <div className="mt-5 space-y-3 text-sm">
            <StatusRow
              label="Supabase client"
              value={isSupabaseConfigured ? "Configured" : "Supabase connection required."}
              ok={isSupabaseConfigured}
              icon={<Database className="h-4 w-4" aria-hidden="true" />}
            />
            <StatusRow
              label="Environment"
              value={environment}
              ok
              icon={<ServerCog className="h-4 w-4" aria-hidden="true" />}
            />
            <StatusRow
              label="Service role"
              value="Backend/admin only"
              ok
              icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
            />
          </div>
        </section>

        <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-jade-ink">Database readiness checklist</h2>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {foundationTables.map((table) => (
              <div
                key={table}
                className="flex items-center gap-2 rounded-md border border-slate-100 px-3 py-2 text-sm font-semibold text-jade-steel"
              >
                <CheckCircle2 className="h-4 w-4 text-jade-blue" aria-hidden="true" />
                {table}
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
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
          <p className="mt-1 text-jade-steel">{value}</p>
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

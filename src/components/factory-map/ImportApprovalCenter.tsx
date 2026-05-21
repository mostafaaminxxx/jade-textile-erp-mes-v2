import type { ReportsImportsData } from "@/types/factory";
import { StatusChip } from "@/components/ui/StatusChip";
import { cn } from "@/lib/utils";

export function ImportApprovalCenter({ summary }: { summary: ReportsImportsData }) {
  return (
    <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-jade-ink">Import approval center</h2>
          <p className="mt-1 text-sm text-jade-steel">
            {summary.totalBatches} import batches, {summary.sourceFiles} source files
          </p>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Pending approval" value={summary.pendingApproval} />
        <Metric label="Applied" value={summary.applied} />
        <Metric label="With conflicts" value={summary.conflicts} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-jade-line text-xs uppercase text-jade-steel">
              <th className="py-3 pr-4">Import</th>
              <th className="py-3 pr-4">Domain</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Total</th>
              <th className="py-3 pr-4">Valid</th>
              <th className="py-3 pr-4">Conflicts</th>
              <th className="py-3 pr-4">Uploaded</th>
              <th className="py-3 pr-4">Applied</th>
            </tr>
          </thead>
          <tbody>
            {summary.batches.map((batch) => (
              <tr
                key={batch.id}
                className={cn(
                  "border-b border-slate-100",
                  batch.import_status === "CONFLICTS_FOUND" && "bg-red-50/60",
                  batch.import_status === "PENDING_APPROVAL" && "bg-orange-50/60",
                  batch.import_status === "APPLIED" && "bg-blue-50/40",
                )}
              >
                <td className="py-3 pr-4 text-jade-steel">{batch.import_name}</td>
                <td className="py-3 pr-4 font-semibold text-jade-ink">
                  {batch.target_domain.replaceAll("_", " ")}
                </td>
                <td className="py-3 pr-4">
                  <StatusChip status={batch.import_status} />
                </td>
                <td className="py-3 pr-4 text-jade-steel">{batch.total_rows}</td>
                <td className="py-3 pr-4 text-jade-steel">{batch.valid_rows}</td>
                <td className="py-3 pr-4 text-jade-steel">{batch.conflict_rows}</td>
                <td className="py-3 pr-4 text-jade-steel">
                  {batch.uploaded_at ?? batch.created_at}
                </td>
                <td className="py-3 pr-4 text-jade-steel">
                  {batch.applied_at ?? "Waiting"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-2xl font-black text-jade-ink">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase text-jade-steel">{label}</p>
    </div>
  );
}

import type { ImportBatchSummary } from "@/types/factory";
import { StatusChip } from "@/components/ui/StatusChip";

export function ImportApprovalCenter({ summary }: { summary: ImportBatchSummary }) {
  return (
    <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-jade-ink">Import approval center</h2>
          <p className="mt-1 text-sm text-jade-steel">
            {summary.totalBatches} import batches, {summary.requiringReview} requiring review
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-jade-line text-xs uppercase text-jade-steel">
              <th className="py-3 pr-4">Domain</th>
              <th className="py-3 pr-4">Import</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Total</th>
              <th className="py-3 pr-4">Valid</th>
              <th className="py-3 pr-4">Conflicts</th>
            </tr>
          </thead>
          <tbody>
            {summary.batches.map((batch) => (
              <tr key={batch.id} className="border-b border-slate-100">
                <td className="py-3 pr-4 font-semibold text-jade-ink">
                  {batch.target_domain.replaceAll("_", " ")}
                </td>
                <td className="py-3 pr-4 text-jade-steel">{batch.import_name}</td>
                <td className="py-3 pr-4">
                  <StatusChip status={batch.import_status} />
                </td>
                <td className="py-3 pr-4 text-jade-steel">{batch.total_rows}</td>
                <td className="py-3 pr-4 text-jade-steel">{batch.valid_rows}</td>
                <td className="py-3 pr-4 text-jade-steel">{batch.conflict_rows}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

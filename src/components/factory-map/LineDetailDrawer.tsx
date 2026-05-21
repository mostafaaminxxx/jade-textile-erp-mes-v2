import type { LineCard } from "@/types/factory";
import { StatusChip } from "@/components/ui/StatusChip";

export function LineDetailDrawer({ line }: { line?: LineCard }) {
  return (
    <aside className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-jade-ink">Line detail</h2>
      {line ? (
        <div className="mt-4 space-y-3 text-sm text-jade-steel">
          <p className="text-2xl font-black text-jade-ink">{line.lineCode}</p>
          <StatusChip status={line.status} />
          <p>Garment type: {line.garmentType}</p>
          <p>
            Feed:{" "}
            {line.feedPercent === null ? "Waiting for data" : `${line.feedPercent}%`}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-jade-steel">
          Select a line to inspect current state. Floor writes will be enabled
          after role/auth setup.
        </p>
      )}
    </aside>
  );
}

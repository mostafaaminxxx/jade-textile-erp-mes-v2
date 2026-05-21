import type { ProductionGroup } from "@/types/database";
import type { LineCard } from "@/types/factory";
import { StatusChip } from "@/components/ui/StatusChip";

export function SupervisorMobileHome({
  groups,
  lines,
}: {
  groups: ProductionGroup[];
  lines: LineCard[];
}) {
  return (
    <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-jade-ink">Supervisor mobile shell</h2>
      <p className="mt-2 text-sm leading-6 text-jade-steel">
        Floor actions will be enabled after role/auth setup.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-bold text-jade-ink">Group selection</span>
          <select className="mt-2 w-full rounded-md border border-jade-line bg-white px-3 py-2 text-sm text-jade-ink">
            {groups.map((group) => (
              <option key={group.id} value={group.group_code}>
                {group.group_code}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-bold text-jade-ink">Line selection</span>
          <select className="mt-2 w-full rounded-md border border-jade-line bg-white px-3 py-2 text-sm text-jade-ink">
            {lines.slice(0, 50).map((line) => (
              <option key={line.id} value={line.lineCode}>
                {line.lineCode}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lines.slice(0, 9).map((line) => (
          <div key={line.id} className="rounded-md border border-jade-line p-3">
            <p className="font-bold text-jade-ink">{line.lineCode}</p>
            <div className="mt-2">
              <StatusChip status={line.status} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

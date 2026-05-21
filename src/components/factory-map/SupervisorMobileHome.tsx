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
        Floor actions will be enabled after authentication, role assignment, and
        downtime/production workflows are activated.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-bold text-jade-ink">Group selection</span>
          <select className="mt-2 min-h-12 w-full rounded-md border border-jade-line bg-white px-4 py-3 text-base font-semibold text-jade-ink">
            {groups.map((group) => (
              <option key={group.id} value={group.group_code}>
                {group.group_code} {group.is_ghost ? "- inactive" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-bold text-jade-ink">Line selection</span>
          <select className="mt-2 min-h-12 w-full rounded-md border border-jade-line bg-white px-4 py-3 text-base font-semibold text-jade-ink">
            {lines.map((line) => (
              <option key={line.id} value={line.lineCode}>
                {line.lineCode}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lines.slice(0, 12).map((line) => (
          <div key={line.id} className="rounded-md border border-jade-line p-4">
            <p className="font-bold text-jade-ink">{line.lineCode}</p>
            <div className="mt-2">
              <StatusChip status={line.status} />
            </div>
            <p className="mt-3 text-sm font-semibold text-jade-steel">
              {line.activeContext ? "Active order context assigned" : "No active order context"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

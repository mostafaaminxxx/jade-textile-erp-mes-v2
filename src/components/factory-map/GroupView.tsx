import type { ProductionGroup } from "@/types/database";
import type { LineCard } from "@/types/factory";
import { MiniLineCard } from "@/components/factory-map/MiniLineCard";
import { LineDetailDrawer } from "@/components/factory-map/LineDetailDrawer";

export function GroupView({
  group,
  lines,
}: {
  group: ProductionGroup;
  lines: LineCard[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-jade-ink">{group.group_code}</h2>
            <p className="mt-1 text-sm font-semibold text-jade-steel">
              {lines.length} real production lines
            </p>
          </div>
          {group.group_code === "G-11" || group.is_ghost ? (
            <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-bold uppercase text-slate-600">
              Ghost / inactive
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {lines.map((line) => (
            <MiniLineCard key={line.id} line={line} />
          ))}
        </div>
      </section>

      <LineDetailDrawer />
    </div>
  );
}

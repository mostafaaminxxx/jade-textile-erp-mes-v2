import Link from "next/link";
import { ArrowRight, Factory } from "lucide-react";
import type { GroupWithLines } from "@/types/factory";
import { cn } from "@/lib/utils";
import { MiniLineCard } from "@/components/factory-map/MiniLineCard";

export function FactoryGroupZone({ group }: { group: GroupWithLines }) {
  const isGhost = group.group_code === "G-11" || group.is_ghost || !group.is_active;

  return (
    <section
      className={cn(
        "rounded-lg border bg-white p-4 shadow-sm",
        isGhost ? "border-dashed border-slate-300 bg-slate-50 opacity-70" : "border-jade-line",
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
              isGhost ? "bg-slate-200 text-slate-500" : "bg-blue-50 text-jade-blue",
            )}
          >
            <Factory className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-jade-ink">
              {group.group_code}
            </h2>
            <p className="text-xs font-semibold uppercase text-jade-steel">
              {isGhost ? "Ghost / inactive zone" : `${group.lines.length} lines`}
            </p>
          </div>
        </div>
        <Link
          href={`/app/live-factory-map/${encodeURIComponent(group.group_code)}`}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-jade-line bg-white text-jade-steel transition hover:text-jade-blue"
          aria-label={`Open ${group.group_code}`}
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {group.lines.slice(0, 12).map((line) => (
          <MiniLineCard key={line.id} line={line} />
        ))}
      </div>
      {group.lines.length > 12 ? (
        <p className="mt-3 text-xs font-semibold text-jade-steel">
          {group.lines.length - 12} more lines in group view
        </p>
      ) : null}
    </section>
  );
}

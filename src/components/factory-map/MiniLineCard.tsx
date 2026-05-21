import { Cog, Flag, Shirt, Timer, Workflow } from "lucide-react";
import { getLineVisualPriority } from "@/lib/data/factory";
import { cn } from "@/lib/utils";
import type { LineCard } from "@/types/factory";
import { StatusChip } from "@/components/ui/StatusChip";

const visualStyles = {
  changeover: "border-orange-300 bg-orange-50 text-orange-900",
  no_feeding: "border-red-300 bg-red-50 text-red-900",
  stopped: "border-slate-300 bg-slate-100 text-slate-600",
  running: "border-blue-300 bg-blue-50 text-blue-900",
  waiting: "border-slate-200 bg-white text-slate-700",
};

export function MiniLineCard({
  line,
  onClick,
}: {
  line: LineCard;
  onClick?: () => void;
}) {
  const visual = getLineVisualPriority(
    line.status,
    line.feedPercent,
    line.stopReason,
  );
  const Icon =
    visual === "changeover"
      ? Cog
      : visual === "no_feeding"
        ? Flag
        : visual === "running"
          ? Workflow
          : visual === "stopped"
            ? Shirt
            : Timer;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-32 rounded-md border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
        visualStyles[visual],
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-black tracking-normal">{line.lineCode}</p>
          <p className="mt-1 text-xs font-semibold capitalize">{line.garmentType}</p>
        </div>
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      </div>

      <div className="mt-3">
        <StatusChip status={line.status} />
      </div>

      {line.feedPercent !== null ? (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-jade-blue"
              style={{ width: `${line.feedPercent}%` }}
            />
          </div>
          <p className="mt-1 text-xs font-semibold">{line.feedPercent}% feed</p>
        </div>
      ) : (
        <p className="mt-4 text-xs font-semibold text-slate-500">
          Waiting for data
        </p>
      )}
    </button>
  );
}

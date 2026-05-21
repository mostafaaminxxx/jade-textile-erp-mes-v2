import type { LineStatus, ReadinessStatus } from "@/types/database";
import { cn } from "@/lib/utils";

type StatusChipStatus = LineStatus | ReadinessStatus | string;

const statusStyles: Record<string, string> = {
  WAITING_FOR_DATA: "border-slate-300 bg-slate-50 text-slate-700",
  RUNNING: "border-blue-300 bg-blue-50 text-blue-800",
  STOPPED: "border-red-300 bg-red-50 text-red-800",
  CHANGEOVER: "border-orange-300 bg-orange-50 text-orange-900",
  QUALITY_HOLD: "border-amber-300 bg-amber-50 text-amber-900",
  NO_FEEDING: "border-red-300 bg-red-50 text-red-800",
  INACTIVE: "border-slate-300 bg-slate-100 text-slate-500",
  READY: "border-blue-300 bg-blue-50 text-blue-800",
  PARTIAL: "border-orange-300 bg-orange-50 text-orange-900",
  RISK: "border-red-300 bg-red-50 text-red-800",
  BLOCKED: "border-red-400 bg-red-100 text-red-900",
  UNKNOWN: "border-slate-300 bg-slate-50 text-slate-700",
};

export function StatusChip({
  status,
  className,
}: {
  status: StatusChipStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase leading-none",
        statusStyles[status] ?? "border-slate-300 bg-white text-slate-700",
        className,
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

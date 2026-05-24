"use client";

import { useState } from "react";
import type { GroupDetailData, LineCard } from "@/types/factory";
import { MiniLineCard } from "@/components/factory-map/MiniLineCard";
import { LineDetailDrawer } from "@/components/factory-map/LineDetailDrawer";
import { StatusChip } from "@/components/ui/StatusChip";

export function GroupView({ data }: { data: GroupDetailData }) {
  const { group, lines, statusDistribution, waitingLineCount, activeContextLineCount } = data;
  const [selectedLine, setSelectedLine] = useState<LineCard | null>(null);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-jade-ink">{group.group_code}</h2>
            <p className="mt-1 text-sm font-semibold text-jade-steel">
              {group.group_name ?? "Factory group"} - {lines.length} real production lines
            </p>
          </div>
          {group.group_code === "G-11" || group.is_ghost ? (
            <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-bold uppercase text-slate-600">
              Ghost / inactive
            </span>
          ) : null}
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <SummaryStat label="Lines" value={lines.length} />
          <SummaryStat label="Waiting status lines" value={waitingLineCount} />
          <SummaryStat label="Assigned lines" value={activeContextLineCount} />
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {statusDistribution.map((item) => (
            <div key={item.status} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-jade-steel">
              <StatusChip status={item.status} />
              <span>{item.count}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {lines.map((line) => (
            <MiniLineCard key={line.id} line={line} onClick={() => setSelectedLine(line)} />
          ))}
        </div>
      </section>

      <LineDetailDrawer line={selectedLine} onClose={() => setSelectedLine(null)} />
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-2xl font-black text-jade-ink">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase text-jade-steel">{label}</p>
    </div>
  );
}

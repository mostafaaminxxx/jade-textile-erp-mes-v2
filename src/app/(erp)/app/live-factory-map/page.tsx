"use client";

import { AuthenticatedDataGate } from "@/components/layout/AuthenticatedDataGate";
import { LiveFactoryMapCanvas } from "@/components/factory-map/LiveFactoryMapCanvas";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { getFactoryMapData } from "@/lib/data/factory";

export default function LiveFactoryMapPage() {
  return (
    <>
      <SectionHeader
        eyebrow="Live Factory Map"
        title="Factory zones G-1 to G-15"
        description="Line states come from production_lines and line_current_state. G-11 is displayed as a ghost/inactive zone. Waiting states remain visible exactly as reported."
      />
      <AuthenticatedDataGate
        queryName="live factory map"
        load={getFactoryMapData}
      >
        {(data) => (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Groups represented" value={data.summary.groupCount} helper="G-1 through G-15" />
              <KpiCard label="Real production lines" value={data.summary.lineCount} helper="All lines from production_lines" />
              <KpiCard label="Waiting status lines" value={data.summary.waitingLineCount} helper="Operational status from line_current_state" />
              <KpiCard label="Active contexts" value={data.summary.activeContextCount} helper="From line_order_contexts" />
            </div>
            <LiveFactoryMapCanvas groupZones={data.groupZones} />
          </div>
        )}
      </AuthenticatedDataGate>
    </>
  );
}

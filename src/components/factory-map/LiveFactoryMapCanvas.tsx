"use client";

import { useState } from "react";
import type { GroupWithLines, LineCard } from "@/types/factory";
import { FactoryGroupZone } from "@/components/factory-map/FactoryGroupZone";
import { LineDetailDrawer } from "@/components/factory-map/LineDetailDrawer";

export function LiveFactoryMapCanvas({
  groupZones,
}: {
  groupZones: GroupWithLines[];
}) {
  const [selectedLine, setSelectedLine] = useState<LineCard | null>(null);

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {groupZones.map((group) => (
          <FactoryGroupZone
            key={group.group_code}
            group={group}
            onLineClick={setSelectedLine}
          />
        ))}
      </div>
      <LineDetailDrawer line={selectedLine} onClose={() => setSelectedLine(null)} />
    </>
  );
}

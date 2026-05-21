import { DataConnectionGate } from "@/components/layout/DataConnectionGate";
import { LiveFactoryMapCanvas } from "@/components/factory-map/LiveFactoryMapCanvas";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getFactoryGroups, getLineCards } from "@/lib/data/factory";

export const dynamic = "force-dynamic";

export default async function LiveFactoryMapPage() {
  const [groups, lines] = await Promise.all([getFactoryGroups(), getLineCards()]);

  return (
    <>
      <SectionHeader
        eyebrow="Live Factory Map"
        title="Factory zones G-1 to G-15"
        description="Line states come from production_lines and line_current_state. G-11 is displayed as a ghost/inactive zone. Waiting states remain visible exactly as reported."
      />
      <DataConnectionGate result={groups}>
        {(groupData) => (
          <DataConnectionGate result={lines}>
            {(lineData) => (
              <LiveFactoryMapCanvas groups={groupData} lines={lineData} />
            )}
          </DataConnectionGate>
        )}
      </DataConnectionGate>
    </>
  );
}

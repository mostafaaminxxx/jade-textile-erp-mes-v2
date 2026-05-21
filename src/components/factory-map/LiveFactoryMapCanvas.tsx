import type { GroupWithLines } from "@/types/factory";
import { FactoryGroupZone } from "@/components/factory-map/FactoryGroupZone";

export function LiveFactoryMapCanvas({
  groupZones,
}: {
  groupZones: GroupWithLines[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
      {groupZones.map((group) => (
        <FactoryGroupZone key={group.group_code} group={group} />
      ))}
    </div>
  );
}

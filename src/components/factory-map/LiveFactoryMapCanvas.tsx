import type { GroupWithLines, LineCard } from "@/types/factory";
import type { ProductionGroup } from "@/types/database";
import { FactoryGroupZone } from "@/components/factory-map/FactoryGroupZone";

const groupOrder = Array.from({ length: 15 }, (_, index) => `G-${index + 1}`);

export function LiveFactoryMapCanvas({
  groups,
  lines,
}: {
  groups: ProductionGroup[];
  lines: LineCard[];
}) {
  const groupsByCode = new Map(groups.map((group) => [group.group_code, group]));
  const linesByGroup = new Map<string, LineCard[]>();

  for (const line of lines) {
    if (!line.groupCode) {
      continue;
    }

    const current = linesByGroup.get(line.groupCode) ?? [];
    current.push(line);
    linesByGroup.set(line.groupCode, current);
  }

  const factoryGroups: GroupWithLines[] = groupOrder.map((groupCode, index) => {
    const existing = groupsByCode.get(groupCode);

    return {
      id: existing?.id ?? groupCode,
      group_code: groupCode,
      group_name: existing?.group_name ?? groupCode,
      display_order: existing?.display_order ?? index + 1,
      is_active: existing?.is_active ?? groupCode !== "G-11",
      is_ghost: existing?.is_ghost ?? groupCode === "G-11",
      lines: linesByGroup.get(groupCode) ?? [],
    };
  });

  return (
    <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
      {factoryGroups.map((group) => (
        <FactoryGroupZone key={group.group_code} group={group} />
      ))}
    </div>
  );
}

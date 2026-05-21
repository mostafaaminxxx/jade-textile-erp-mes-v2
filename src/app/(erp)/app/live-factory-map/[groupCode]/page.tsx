import { notFound } from "next/navigation";
import { GroupView } from "@/components/factory-map/GroupView";
import { DataConnectionGate } from "@/components/layout/DataConnectionGate";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getFactoryGroups, getLineCards } from "@/lib/data/factory";

export const dynamic = "force-dynamic";

export default async function LiveFactoryGroupPage({
  params,
}: {
  params: Promise<{ groupCode: string }>;
}) {
  const { groupCode } = await params;
  const decodedGroupCode = decodeURIComponent(groupCode);
  const [groups, lines] = await Promise.all([getFactoryGroups(), getLineCards()]);

  return (
    <>
      <SectionHeader
        eyebrow="Live Factory Map"
        title={`Group ${decodedGroupCode}`}
        description="Group view shows real production lines and the current line state from Supabase."
      />
      <DataConnectionGate result={groups}>
        {(groupData) => {
          const group = groupData.find((item) => item.group_code === decodedGroupCode);

          if (!group) {
            notFound();
          }

          return (
            <DataConnectionGate result={lines}>
              {(lineData) => (
                <GroupView
                  group={group}
                  lines={lineData.filter(
                    (line) => line.groupCode === decodedGroupCode,
                  )}
                />
              )}
            </DataConnectionGate>
          );
        }}
      </DataConnectionGate>
    </>
  );
}

import { GroupView } from "@/components/factory-map/GroupView";
import { DataConnectionGate } from "@/components/layout/DataConnectionGate";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getGroupDetailData } from "@/lib/data/factory";

export const dynamic = "force-dynamic";

export default async function LiveFactoryGroupPage({
  params,
}: {
  params: Promise<{ groupCode: string }>;
}) {
  const { groupCode } = await params;
  const decodedGroupCode = decodeURIComponent(groupCode);
  const group = await getGroupDetailData(decodedGroupCode);

  return (
    <>
      <SectionHeader
        eyebrow="Live Factory Map"
        title={`Group ${decodedGroupCode}`}
        description="Group view shows real production lines and the current line state from Supabase."
      />
      <DataConnectionGate result={group}>
        {(data) => <GroupView data={data} />}
      </DataConnectionGate>
    </>
  );
}

"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import { GroupView } from "@/components/factory-map/GroupView";
import { AuthenticatedDataGate } from "@/components/layout/AuthenticatedDataGate";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getGroupDetailData } from "@/lib/data/factory";

export default function LiveFactoryGroupPage() {
  const params = useParams<{ groupCode: string }>();
  const decodedGroupCode = decodeURIComponent(params.groupCode);
  const loadGroupData = useCallback(
    () => getGroupDetailData(decodedGroupCode),
    [decodedGroupCode],
  );

  return (
    <>
      <SectionHeader
        eyebrow="Live Factory Map"
        title={`Group ${decodedGroupCode}`}
        description="Group view shows real production lines and the current line state from Supabase."
      />
      <AuthenticatedDataGate
        queryName={`factory group ${decodedGroupCode}`}
        load={loadGroupData}
      >
        {(data) => <GroupView data={data} />}
      </AuthenticatedDataGate>
    </>
  );
}

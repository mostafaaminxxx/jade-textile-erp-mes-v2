import { LineAssignmentCenter } from "@/components/factory-map/LineAssignmentCenter";
import { DataConnectionGate } from "@/components/layout/DataConnectionGate";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getLineAssignmentCenterData } from "@/lib/data/factory";

export const dynamic = "force-dynamic";

export default async function LineAssignmentCenterPage() {
  const data = await getLineAssignmentCenterData();

  return (
    <>
      <SectionHeader
        eyebrow="Orders & Planning"
        title="Line Assignment Center"
        description="Planning/Admin review screen for connecting real orders to real production lines. No automatic assignments are created."
      />
      <DataConnectionGate result={data}>
        {(assignmentData) => <LineAssignmentCenter data={assignmentData} />}
      </DataConnectionGate>
    </>
  );
}

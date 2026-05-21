import { DataConnectionGate } from "@/components/layout/DataConnectionGate";
import { SupervisorMobileHome } from "@/components/factory-map/SupervisorMobileHome";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getFactoryGroups, getLineCards } from "@/lib/data/factory";

export const dynamic = "force-dynamic";

export default async function ProductionExecutionPage() {
  const [groups, lines] = await Promise.all([getFactoryGroups(), getLineCards()]);

  return (
    <>
      <SectionHeader
        eyebrow="Production Execution"
        title="Supervisor shell"
        description="Read-only production execution shell for current line state. Floor writes are intentionally disabled until auth, roles, and approvals are active."
      />
      <DataConnectionGate result={groups}>
        {(groupData) => (
          <DataConnectionGate result={lines}>
            {(lineData) => (
              <SupervisorMobileHome groups={groupData} lines={lineData} />
            )}
          </DataConnectionGate>
        )}
      </DataConnectionGate>
    </>
  );
}

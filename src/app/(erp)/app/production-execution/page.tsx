"use client";

import { AuthenticatedDataGate } from "@/components/layout/AuthenticatedDataGate";
import { SupervisorMobileHome } from "@/components/factory-map/SupervisorMobileHome";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getFactoryGroups, getLineCards } from "@/lib/data/factory";

export default function ProductionExecutionPage() {
  return (
    <>
      <SectionHeader
        eyebrow="Production Execution"
        title="Supervisor shell"
        description="Read-only production execution shell for current line state. Floor writes are intentionally disabled until auth, roles, and approvals are active."
      />
      <AuthenticatedDataGate queryName="production groups" load={getFactoryGroups}>
        {(groupData) => (
          <AuthenticatedDataGate queryName="line cards" load={getLineCards}>
            {(lineData) => (
              <SupervisorMobileHome groups={groupData} lines={lineData} />
            )}
          </AuthenticatedDataGate>
        )}
      </AuthenticatedDataGate>
    </>
  );
}

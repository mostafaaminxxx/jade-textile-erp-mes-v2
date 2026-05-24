"use client";

import { AuthenticatedDataGate } from "@/components/layout/AuthenticatedDataGate";
import { ImportApprovalCenter } from "@/components/factory-map/ImportApprovalCenter";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getReportsImportsData } from "@/lib/data/factory";

export default function ReportsImportsPage() {
  return (
    <>
      <SectionHeader
        eyebrow="Reports & Imports"
        title="Import governance"
        description="Real import batches and source-file driven rows only. This page does not create developer demo tools."
      />
      <AuthenticatedDataGate
        queryName="reports and imports"
        load={getReportsImportsData}
      >
        {(data) => <ImportApprovalCenter summary={data} />}
      </AuthenticatedDataGate>
    </>
  );
}

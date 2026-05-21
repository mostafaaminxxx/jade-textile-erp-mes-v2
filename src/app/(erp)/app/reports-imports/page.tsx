import { DataConnectionGate } from "@/components/layout/DataConnectionGate";
import { ImportApprovalCenter } from "@/components/factory-map/ImportApprovalCenter";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getImportBatchSummary } from "@/lib/data/factory";

export const dynamic = "force-dynamic";

export default async function ReportsImportsPage() {
  const summary = await getImportBatchSummary();

  return (
    <>
      <SectionHeader
        eyebrow="Reports & Imports"
        title="Import governance"
        description="Real import batches and source-file driven rows only. This page does not create developer demo tools."
      />
      <DataConnectionGate result={summary}>
        {(data) => <ImportApprovalCenter summary={data} />}
      </DataConnectionGate>
    </>
  );
}

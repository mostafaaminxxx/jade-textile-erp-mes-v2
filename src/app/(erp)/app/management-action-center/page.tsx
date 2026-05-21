import { CheckCircle2 } from "lucide-react";
import { EmptyFactoryDataState } from "@/components/layout/EmptyFactoryDataState";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function ManagementActionCenterPage() {
  return (
    <>
      <SectionHeader
        eyebrow="Management Action Center"
        title="Management actions"
        description="This area will convert real exceptions into accountable actions after workflow ownership and permissions are configured."
      />
      <div className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3 text-jade-ink">
          <CheckCircle2 className="h-5 w-5 text-jade-blue" aria-hidden="true" />
          <h2 className="text-lg font-bold">Action workflow foundation</h2>
        </div>
        <EmptyFactoryDataState message="Waiting for real factory data." />
      </div>
    </>
  );
}

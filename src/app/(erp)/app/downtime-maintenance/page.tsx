import { Wrench } from "lucide-react";
import { EmptyFactoryDataState } from "@/components/layout/EmptyFactoryDataState";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function DowntimeMaintenancePage() {
  return (
    <>
      <SectionHeader
        eyebrow="Downtime & Maintenance"
        title="Downtime and maintenance"
        description="This section is reserved for real stop reasons, maintenance tickets, and approved downtime events. No fake stopped lines are generated."
      />
      <div className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3 text-jade-ink">
          <Wrench className="h-5 w-5 text-jade-blue" aria-hidden="true" />
          <h2 className="text-lg font-bold">Maintenance event foundation</h2>
        </div>
        <EmptyFactoryDataState message="Waiting for real factory data." />
      </div>
    </>
  );
}

import { ShieldAlert } from "lucide-react";
import { EmptyFactoryDataState } from "@/components/layout/EmptyFactoryDataState";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function QualityShipmentRiskPage() {
  return (
    <>
      <SectionHeader
        eyebrow="Quality & Shipment Risk"
        title="Quality and shipment risk"
        description="Risk views will use real quality holds, shipment dates, and severity records when those operational feeds are approved."
      />
      <div className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3 text-jade-ink">
          <ShieldAlert className="h-5 w-5 text-jade-blue" aria-hidden="true" />
          <h2 className="text-lg font-bold">Risk foundation</h2>
        </div>
        <EmptyFactoryDataState message="Waiting for real factory data." />
      </div>
    </>
  );
}

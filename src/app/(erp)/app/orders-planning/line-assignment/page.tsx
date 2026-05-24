"use client";

import { LineAssignmentCenter } from "@/components/factory-map/LineAssignmentCenter";
import { AuthenticatedDataGate } from "@/components/layout/AuthenticatedDataGate";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getLineAssignmentCenterData } from "@/lib/data/factory";

export default function LineAssignmentCenterPage() {
  return (
    <>
      <SectionHeader
        eyebrow="Orders & Planning"
        title="Line Assignment Center"
        description="Planning/Admin review screen for connecting real orders to real production lines. No automatic assignments are created."
      />
      <AuthenticatedDataGate
        queryName="line assignment center"
        load={getLineAssignmentCenterData}
      >
        {(assignmentData) => <LineAssignmentCenter data={assignmentData} />}
      </AuthenticatedDataGate>
    </>
  );
}

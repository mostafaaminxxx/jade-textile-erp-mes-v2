"use client";

import { PreviewTestCenter } from "@/components/settings/PreviewTestCenter";
import { AuthenticatedDataGate } from "@/components/layout/AuthenticatedDataGate";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getPreviewTestCenterData } from "@/lib/data/factory";

export function PreviewTestCenterPageClient({
  firstAdminSql,
  rollbackSql,
}: {
  firstAdminSql: string;
  rollbackSql: string;
}) {
  return (
    <>
      <SectionHeader
        eyebrow="Settings / Admin"
        title="Preview & Controlled Test Center"
        description="Review environment, auth/profile readiness, and controlled assignment testing without creating users, profiles, assignments, production, or downtime data."
      />
      <AuthenticatedDataGate
        queryName="preview and controlled test center"
        load={getPreviewTestCenterData}
      >
        {(previewData) => (
          <PreviewTestCenter
            data={previewData}
            firstAdminSql={firstAdminSql}
            rollbackSql={rollbackSql}
          />
        )}
      </AuthenticatedDataGate>
    </>
  );
}

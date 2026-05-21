import { readFile } from "node:fs/promises";
import path from "node:path";
import { PreviewTestCenter } from "@/components/settings/PreviewTestCenter";
import { DataConnectionGate } from "@/components/layout/DataConnectionGate";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getPreviewTestCenterData } from "@/lib/data/factory";

export const dynamic = "force-dynamic";

export default async function PreviewTestCenterPage() {
  const [data, firstAdminSql, rollbackSql] = await Promise.all([
    getPreviewTestCenterData(),
    readManualSql("001_create_first_admin_profile.sql"),
    readManualSql("002_rollback_controlled_assignment_test.sql"),
  ]);

  return (
    <>
      <SectionHeader
        eyebrow="Settings / Admin"
        title="Preview & Controlled Test Center"
        description="Review environment, auth/profile readiness, and controlled assignment testing without creating users, profiles, assignments, production, or downtime data."
      />
      <DataConnectionGate result={data}>
        {(previewData) => (
          <PreviewTestCenter
            data={previewData}
            firstAdminSql={firstAdminSql}
            rollbackSql={rollbackSql}
          />
        )}
      </DataConnectionGate>
    </>
  );
}

async function readManualSql(fileName: string) {
  return readFile(path.join(process.cwd(), "supabase", "manual", fileName), "utf8");
}

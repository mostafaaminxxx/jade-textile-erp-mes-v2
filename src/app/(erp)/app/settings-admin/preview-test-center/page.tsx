import { readFile } from "node:fs/promises";
import path from "node:path";
import { PreviewTestCenterPageClient } from "@/components/settings/PreviewTestCenterPageClient";

export default async function PreviewTestCenterPage() {
  const [firstAdminSql, rollbackSql] = await Promise.all([
    readManualSql("001_create_first_admin_profile.sql"),
    readManualSql("002_rollback_controlled_assignment_test.sql"),
  ]);

  return (
    <PreviewTestCenterPageClient
      firstAdminSql={firstAdminSql}
      rollbackSql={rollbackSql}
    />
  );
}

async function readManualSql(fileName: string) {
  return readFile(path.join(process.cwd(), "supabase", "manual", fileName), "utf8");
}

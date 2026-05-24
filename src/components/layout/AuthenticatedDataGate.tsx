"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { FactoryDataResult } from "@/types/factory";
import { DataConnectionGate } from "@/components/layout/DataConnectionGate";
import { getCurrentUserClient } from "@/lib/data/auth-client";

const DATA_ACCESS_ERROR = "Data access blocked or query failed.";

export function AuthenticatedDataGate<T>({
  queryName,
  load,
  children,
}: {
  queryName: string;
  load: () => Promise<FactoryDataResult<T>>;
  children: (data: T) => ReactNode;
}) {
  const [result, setResult] = useState<FactoryDataResult<T> | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadData() {
      try {
        const user = await getCurrentUserClient();

        if (!isActive) {
          return;
        }

        if (!user.user) {
          setResult({
            status:
              user.message === "Supabase connection required."
                ? "not_configured"
                : "error",
            message:
              user.message === "Supabase connection required."
                ? user.message
                : DATA_ACCESS_ERROR,
            cause:
              user.message === "Supabase connection required."
                ? undefined
                : `${queryName}: authenticated Supabase session required. Sign in from /login, then refresh this page.`,
          });
          return;
        }

        const data = await load();

        if (isActive) {
          setResult(data);
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        setResult({
          status: "error",
          message: DATA_ACCESS_ERROR,
          cause: `${queryName}: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    void loadData();

    return () => {
      isActive = false;
    };
  }, [load, queryName]);

  if (!result) {
    return (
      <div className="rounded-lg border border-jade-line bg-white p-6 shadow-sm">
        <p className="font-bold text-jade-ink">Loading real factory data...</p>
        <p className="mt-2 text-sm leading-6 text-jade-steel">
          Reading from Supabase using the signed-in browser session.
        </p>
      </div>
    );
  }

  return <DataConnectionGate result={result}>{children}</DataConnectionGate>;
}

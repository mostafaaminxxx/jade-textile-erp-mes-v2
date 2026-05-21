import type { ReactNode } from "react";
import type { FactoryDataResult } from "@/types/factory";
import { EmptyFactoryDataState } from "@/components/layout/EmptyFactoryDataState";
import { FactoryErrorState } from "@/components/layout/FactoryErrorState";

export function DataConnectionGate<T>({
  result,
  children,
}: {
  result: FactoryDataResult<T>;
  children: (data: T) => ReactNode;
}) {
  if (result.status === "not_configured") {
    return <FactoryErrorState title={result.message} />;
  }

  if (result.status === "empty") {
    return <EmptyFactoryDataState message={result.message} />;
  }

  if (result.status === "error") {
    return <FactoryErrorState title={result.message} detail={result.cause} />;
  }

  return <>{children(result.data)}</>;
}

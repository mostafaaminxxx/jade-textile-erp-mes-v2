import { AlertTriangle } from "lucide-react";

export function FactoryErrorState({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-orange-700" aria-hidden="true" />
        <div>
          <p className="font-bold text-orange-950">{title}</p>
          {detail ? (
            <p className="mt-2 text-sm leading-6 text-orange-900">{detail}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

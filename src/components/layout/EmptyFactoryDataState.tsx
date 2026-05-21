import { Inbox } from "lucide-react";

export function EmptyFactoryDataState({
  message = "Waiting for real factory data.",
}: {
  message?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-jade-line bg-white p-8 text-center">
      <Inbox className="mx-auto h-9 w-9 text-jade-steel" aria-hidden="true" />
      <p className="mt-3 text-base font-bold text-jade-ink">{message}</p>
      <p className="mt-2 text-sm text-jade-steel">
        No demo records are generated in Jade Textile ERP/MES V2.
      </p>
    </div>
  );
}

import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string | number;
  helper?: string;
  icon?: ReactNode;
}) {
  return (
    <article className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-jade-steel">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-normal text-jade-ink">
            {value}
          </p>
        </div>
        {icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-jade-blue">
            {icon}
          </div>
        ) : null}
      </div>
      {helper ? <p className="mt-3 text-sm text-jade-steel">{helper}</p> : null}
    </article>
  );
}

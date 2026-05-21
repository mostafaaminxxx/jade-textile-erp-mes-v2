import Link from "next/link";
import { Factory, ShieldCheck } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="w-full max-w-md rounded-lg border border-jade-line bg-white p-8 shadow-control">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-jade-blue text-white">
            <Factory className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-jade-orange">
              Jade Textile
            </p>
            <h1 className="text-2xl font-bold text-jade-ink">ERP/MES V2</h1>
          </div>
        </div>

        <div className="rounded-md border border-dashed border-jade-line bg-jade-panel p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-jade-ink">
            <ShieldCheck className="h-4 w-4 text-jade-blue" aria-hidden="true" />
            Auth-ready shell
          </div>
          <p className="text-sm leading-6 text-jade-steel">
            Authentication is not enforced yet. Local development can view the
            factory shell while Supabase Auth and role policies are wired.
          </p>
        </div>

        <div className="mt-6 rounded-md bg-orange-50 px-4 py-3 text-sm font-medium text-orange-900">
          {isSupabaseConfigured
            ? "Supabase client variables are present."
            : "Supabase connection required."}
        </div>

        <Link
          href="/app"
          className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-jade-blue px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          Open factory shell
        </Link>
      </section>
    </main>
  );
}

import Link from "next/link";
import { ArrowRight, Factory } from "lucide-react";
import { LoginAuthPanel } from "@/components/auth/LoginAuthPanel";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-jade-bg px-6 py-10">
      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[420px_1fr] lg:items-start">
        <div className="pt-4">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-jade-blue text-white">
              <Factory className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-jade-orange">
                Jade Textile
              </p>
              <h1 className="text-3xl font-black text-jade-ink">ERP/MES V2 Login</h1>
            </div>
          </div>

          <div className="space-y-4 text-sm leading-7 text-jade-steel">
            <p>
              Sign in with a real Supabase Auth account. Operational writes remain
              blocked until an admin creates and activates a matching profile role.
            </p>
            <p>
              Sign up creates only the auth user. It does not create an admin profile,
              assign a role, or enable factory writes by itself.
            </p>
          </div>

          <Link
            href="/app"
            className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-jade-blue px-4 py-3 text-sm font-black text-white transition hover:bg-blue-800"
          >
            Open factory shell
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <section className="rounded-lg border border-jade-line bg-white p-6 shadow-control">
          <LoginAuthPanel />
        </section>
      </section>
    </main>
  );
}

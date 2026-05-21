import { Bell, Database, Menu, ShieldCheck } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-jade-line bg-white/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-md border border-jade-line bg-white text-jade-steel lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-jade-orange">
            Live Factory Map
          </p>
          <p className="text-sm font-semibold text-jade-ink">
            One factory, one data source, one operational flow
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold uppercase text-orange-900 sm:inline-flex">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Auth not configured yet
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-jade-line bg-white px-3 py-1.5 text-xs font-bold uppercase text-jade-steel">
          <Database className="h-3.5 w-3.5" aria-hidden="true" />
          {isSupabaseConfigured ? "Supabase ready" : "Connection required"}
        </span>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-md border border-jade-line bg-white text-jade-steel"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

import type { ReactNode } from "react";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { TopBar } from "@/components/layout/TopBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="flex min-h-screen">
        <SidebarNavigation />
        <div className="min-w-0 flex-1">
          <TopBar />
          <main className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

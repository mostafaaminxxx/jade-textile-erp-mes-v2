"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  Factory,
  FileInput,
  Gauge,
  Link2,
  Map,
  PackageCheck,
  Settings,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    label: "Executive Command Center",
    href: "/app/executive-command-center",
    icon: Gauge,
  },
  { label: "Live Factory Map", href: "/app/live-factory-map", icon: Map },
  { label: "Orders & Planning", href: "/app/orders-planning", icon: ClipboardList },
  {
    label: "Line Assignment Center",
    href: "/app/orders-planning/line-assignment",
    icon: Link2,
  },
  {
    label: "Material & WIP Readiness",
    href: "/app/material-wip-readiness",
    icon: Boxes,
  },
  {
    label: "Production Execution",
    href: "/app/production-execution",
    icon: Factory,
  },
  {
    label: "Downtime & Maintenance",
    href: "/app/downtime-maintenance",
    icon: Wrench,
  },
  {
    label: "Quality & Shipment Risk",
    href: "/app/quality-shipment-risk",
    icon: ShieldAlert,
  },
  {
    label: "Management Action Center",
    href: "/app/management-action-center",
    icon: PackageCheck,
  },
  { label: "Reports & Imports", href: "/app/reports-imports", icon: FileInput },
  { label: "Settings / Admin", href: "/app/settings-admin", icon: Settings },
];

export function SidebarNavigation() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-jade-line bg-white lg:block">
      <div className="flex h-20 items-center gap-3 border-b border-jade-line px-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-jade-blue text-white">
          <Factory className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-jade-orange">
            Jade Textile
          </p>
          <p className="text-base font-bold text-jade-ink">ERP/MES V2</p>
        </div>
      </div>

      <nav className="factory-scrollbar h-[calc(100vh-5rem)] overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mb-1 flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-jade-steel transition",
                active
                  ? "bg-blue-50 text-jade-blue"
                  : "hover:bg-jade-panel hover:text-jade-ink",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export { navigation as topLevelNavigation };

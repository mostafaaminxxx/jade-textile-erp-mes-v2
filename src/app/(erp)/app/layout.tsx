import { AppShell } from "@/components/layout/AppShell";

export default function ErpLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import type { UserRole } from "@/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <DashboardShell role={session.user.role as UserRole} fullName={session.user.name}>
      {children}
    </DashboardShell>
  );
}

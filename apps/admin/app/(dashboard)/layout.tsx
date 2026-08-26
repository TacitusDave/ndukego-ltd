import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/shell";
import { PermissionsProvider } from "@/components/layout/permissions-context";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const permissions = session.user.permissions ?? [];

  return (
    <PermissionsProvider permissions={permissions}>
      <Shell>{children}</Shell>
    </PermissionsProvider>
  );
}

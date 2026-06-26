import { AdminLayout } from "@/components/admin/AdminLayout";

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}

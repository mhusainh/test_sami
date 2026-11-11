import AdminShell from "@/components/AdminShell";

export const metadata = { title: "Admin HRD — SAMI" };
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}

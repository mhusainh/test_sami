import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [totalApps, stages, jobs, recent] = await Promise.all([
    prisma.applications.count(),
    prisma.application_stages.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { applications: true } } } }),
    prisma.lowongan.count({ where: { is_active: true } }),
    prisma.applications.findMany({
      take: 8,
      orderBy: { created_at: "desc" },
      include: { lowongan: true, stage: true },
    }),
  ]);

  const stats = [
    { label: "Total Pelamar", value: totalApps },
    { label: "Lowongan Aktif", value: jobs },
    { label: "Tahap Progres", value: stages.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">Ringkasan rekrutmen.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Pelamar per Tahap</h2>
            <Link href="/admin/tahap" className="text-sm font-medium text-red-600 hover:underline">
              Kelola tahap
            </Link>
          </div>
          <ul className="space-y-2">
            {stages.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                <span className="font-medium text-slate-800">
                  {s.order}. {s.name}
                </span>
                <span className="tabular-nums text-slate-600">{s._count.applications}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Lamaran Terbaru</h2>
            <Link href="/admin/pelamar" className="text-sm font-medium text-red-600 hover:underline">
              Lihat semua
            </Link>
          </div>
          <ul className="space-y-2">
            {recent.length === 0 && <li className="text-sm text-slate-500">Belum ada pelamar.</li>}
            {recent.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/admin/pelamar/${a.id}`}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-800">{a.full_name}</span>
                  <span className="text-slate-500">{a.stage.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

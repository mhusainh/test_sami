"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Lowongan = {
  id: string;
  code: string;
  title: string;
  placement: string;
  qualification: string;
  period: string;
};

function LinkShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">{children}</div>;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const title = searchParams.get("title");
  const periode = searchParams.get("periode");

  const [jobs, setJobs] = useState<Lowongan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/public/lowongan");
        const json = await res.json();
        if (!cancelled) {
          if (!res.ok) throw new Error(json.error || "Gagal memuat");
          setJobs(json.data || []);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Gagal memuat lowongan");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const matched = useMemo(() => {
    if (!code) return null;
    return jobs.find((j) => j.code === code) || null;
  }, [code, jobs]);

  useEffect(() => {
    if (matched) {
      // stay on page; form section shown below
    }
  }, [matched]);

  function goRegister(job: Lowongan) {
    const params = new URLSearchParams({ code: job.code, title: job.title, periode: job.period });
    router.push(`/daftar?${params.toString()}`);
  }

  return (
    <LinkShell>
      <header className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600">PT SAMI</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Lowongan Kerja SAMI
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            Pilih posisi yang sesuai, lalu daftar secara online. Unggah CV, ijazah, dan foto 3x4
            dalam satu form.
          </p>
        </div>
        <a
          href="/login"
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Login HRD
        </a>
      </header>

      {loading && <p className="text-sm text-slate-500">Memuat lowongan…</p>}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Job</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Penempatan</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Kualifikasi</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Pendaftaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      Belum ada lowongan aktif.
                    </td>
                  </tr>
                )}
                {jobs.map((job) => (
                  <tr key={job.id} className={code === job.code ? "bg-red-50/40" : undefined}>
                    <td className="px-4 py-4 align-top font-medium text-slate-900">{job.title}</td>
                    <td className="px-4 py-4 align-top text-slate-700">{job.placement}</td>
                    <td className="px-4 py-4 align-top text-slate-700">
                      <ul className="list-disc space-y-1 pl-4">
                        {job.qualification.split("\n").filter(Boolean).map((line, i) => (
                          <li key={i}>{line.replace(/^-\s*/, "")}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-slate-500">Periode {job.period}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <button type="button" onClick={() => goRegister(job)} className="btn-primary">
                        Daftar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {matched && (
        <p className="mt-4 text-sm text-slate-600">
          Lowongan <strong>{matched.title || title}</strong> (kode <code>{matched.code}</code>,
          periode {matched.period || periode}) dipilih. Klik <strong>Daftar</strong> untuk membuka
          form.
        </p>
      )}

      <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} PT SAMI — Sistem Rekrutmen Online
      </footer>
    </LinkShell>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-slate-500">Memuat…</div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

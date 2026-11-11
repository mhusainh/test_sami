"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ApplicationRow = {
  id: string;
  registration_code: string;
  full_name: string;
  email: string;
  phone1: string;
  periode: string;
  final_score: number | null;
  created_at: string;
  lowongan: { id: string; title: string; placement: string };
  stage: { id: string; name: string; order: number };
};

type Stage = { id: string; name: string };
type Job = { id: string; title: string };

export default function PelamarPage() {
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("");
  const [job, setJob] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (stage) params.set("stage", stage);
      if (job) params.set("job", job);
      const res = await fetch(`/api/applications?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat");
      setRows(json.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      const [sRes, jRes] = await Promise.all([fetch("/api/stages"), fetch("/api/lowongan")]);
      const sJson = await sRes.json();
      const jJson = await jRes.json();
      if (sRes.ok) setStages(sJson.data || []);
      if (jRes.ok) setJobs(jJson.data || []);
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, stage, job]);

  function exportUrl() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (stage) params.set("stage", stage);
    if (job) params.set("job", job);
    return `/api/applications/export?${params.toString()}`;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Daftar Pelamar</h1>
          <p className="text-sm text-slate-600">{rows.length} data sesuai filter</p>
        </div>
        <a href={exportUrl()} className="btn-primary">
          Export Excel
        </a>
      </div>

      <div className="card grid gap-3 p-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="q">
            Cari
          </label>
          <input
            id="q"
            className="input"
            placeholder="Nama, kode, KTP, email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="stage">
            Progres
          </label>
          <select id="stage" className="input" value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="">Semua</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="job">
            Lowongan
          </label>
          <select id="job" className="input" value={job} onChange={(e) => setJob(e.target.value)}>
            <option value="">Semua</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Kode</th>
                <th className="px-4 py-3 text-left font-semibold">Nama</th>
                <th className="px-4 py-3 text-left font-semibold">Lowongan</th>
                <th className="px-4 py-3 text-left font-semibold">Progres</th>
                <th className="px-4 py-3 text-left font-semibold">Nilai</th>
                <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                <th className="px-4 py-3 text-left font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Memuat…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Belum ada pelamar.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.registration_code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{r.full_name}</td>
                    <td className="px-4 py-3 text-slate-700">{r.lowongan.title}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {r.stage.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">
                      {r.final_score !== null ? `${r.final_score}/100` : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(r.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/pelamar/${r.id}`} className="font-medium text-red-600 hover:underline">
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

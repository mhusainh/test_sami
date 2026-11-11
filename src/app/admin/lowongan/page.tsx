"use client";

import { useEffect, useState } from "react";

type Job = {
  id: string;
  code: string;
  title: string;
  placement: string;
  qualification: string;
  period: string;
  is_active: boolean;
  sort_order: number;
};

const empty = {
  code: "",
  title: "",
  placement: "",
  qualification: "",
  period: "",
  is_active: true,
  sort_order: 0,
};

export default function LowonganAdminPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState({ ...empty });
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/lowongan");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat");
      setJobs(json.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function reset() {
    setForm({ ...empty });
    setEditId(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      const url = editId ? `/api/lowongan/${editId}` : "/api/lowongan";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      setMsg(editId ? "Lowongan diperbarui." : "Lowongan ditambahkan.");
      reset();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan");
    }
  }

  function startEdit(job: Job) {
    setEditId(job.id);
    setForm({
      code: job.code,
      title: job.title,
      placement: job.placement,
      qualification: job.qualification,
      period: job.period,
      is_active: job.is_active,
      sort_order: job.sort_order,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id: string) {
    if (!confirm("Hapus lowongan ini?")) return;
    setMsg("");
    setError("");
    const res = await fetch(`/api/lowongan/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Gagal hapus");
      return;
    }
    setMsg("Lowongan dihapus.");
    await load();
  }

  async function toggleActive(job: Job) {
    await fetch(`/api/lowongan/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !job.is_active }),
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Lowongan</h1>
        <p className="text-sm text-slate-600">CRUD data lowongan untuk halaman pelamar.</p>
      </div>

      {msg && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{msg}</div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={onSubmit} className="card space-y-4 p-5">
        <h2 className="font-semibold text-slate-900">{editId ? "Ubah Lowongan" : "Tambah Lowongan"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="code">Kode</label>
            <input id="code" className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          </div>
          <div>
            <label className="label" htmlFor="period">Periode</label>
            <input id="period" className="input" placeholder="202505" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} required />
          </div>
          <div>
            <label className="label" htmlFor="title">Job / Title</label>
            <input id="title" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="label" htmlFor="placement">Penempatan</label>
            <input id="placement" className="input" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })} required />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="qualification">Kualifikasi (satu poin per baris)</label>
            <textarea
              id="qualification"
              rows={4}
              className="input"
              value={form.qualification}
              onChange={(e) => setForm({ ...form, qualification: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="sort_order">Urutan Tampil</label>
            <input
              id="sort_order"
              type="number"
              className="input"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-end gap-4 pb-1">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              Aktif
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary">
            {editId ? "Simpan Perubahan" : "Tambah"}
          </button>
          {editId && (
            <button type="button" className="btn-secondary" onClick={reset}>
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Kode</th>
                <th className="px-4 py-3 text-left font-semibold">Job</th>
                <th className="px-4 py-3 text-left font-semibold">Penempatan</th>
                <th className="px-4 py-3 text-left font-semibold">Periode</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">Memuat…</td>
                </tr>
              )}
              {!loading && jobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">Belum ada lowongan.</td>
                </tr>
              )}
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-xs">{job.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{job.title}</td>
                  <td className="px-4 py-3 text-slate-700">{job.placement}</td>
                  <td className="px-4 py-3 text-slate-600">{job.period}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(job)}
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        job.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {job.is_active ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-sm font-medium">
                      <button type="button" className="text-red-600 hover:underline" onClick={() => startEdit(job)}>
                        Ubah
                      </button>
                      <button type="button" className="text-slate-600 hover:underline" onClick={() => remove(job.id)}>
                        Hapus
                      </button>
                    </div>
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

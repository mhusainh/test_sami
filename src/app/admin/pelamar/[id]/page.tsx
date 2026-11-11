"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Stage = { id: string; name: string; order: number };
type Score = {
  id: string;
  stage_id: string;
  score: string | number;
  notes?: string | null;
  stage?: { name: string };
};
type Detail = {
  id: string;
  registration_code: string;
  full_name: string;
  nik: string;
  kk_number: string;
  mother_name: string;
  phone1: string;
  phone2?: string | null;
  birth_place: string;
  birth_date: string;
  gender: string;
  info_source: string;
  disability: string;
  worked_yazaki: boolean;
  marital_status: string;
  email: string;
  religion: string;
  education: string;
  major: string;
  school_name: string;
  gpa: string;
  province: string;
  regency: string;
  district: string;
  village: string;
  postal_code: string;
  address: string;
  cv_url?: string | null;
  ijazah_url?: string | null;
  foto_url?: string | null;
  periode: string;
  notes?: string | null;
  final_score: number | null;
  lowongan: { title: string; placement: string };
  stage: { id: string; name: string };
  experiences: { id: string; company_name: string; position: string; year_range?: string | null }[];
  scores: Score[];
  logs: {
    id: string;
    created_at: string;
    from_stage?: { name: string } | null;
    to_stage: { name: string };
    admin?: { username: string } | null;
  }[];
};

export default function PelamarDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [detail, setDetail] = useState<Detail | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [stageId, setStageId] = useState("");
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [dRes, sRes] = await Promise.all([
      fetch(`/api/applications/${id}`),
      fetch("/api/stages"),
    ]);
    const dJson = await dRes.json();
    const sJson = await sRes.json();
    if (!dRes.ok) {
      setError(dJson.error || "Gagal memuat");
      return;
    }
    setDetail(dJson.data);
    setStageId(dJson.data.stage_id);
    if (sRes.ok) setStages(sJson.data || []);
    const map: Record<string, string> = {};
    for (const sc of dJson.data.scores || []) {
      map[sc.stage_id] = String(sc.score);
    }
    setScoreInputs(map);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStage(next: string) {
    setMsg("");
    setError("");
    setStageId(next);
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage_id: next }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Gagal ubah tahap");
      await load();
      return;
    }
    setMsg("Progres diperbarui.");
    await load();
  }

  async function saveScore(stageIdScore: string) {
    setMsg("");
    setError("");
    const raw = scoreInputs[stageIdScore];
    if (raw === undefined || raw === "") return;
    const score = Number(raw);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      setError("Nilai harus 0–100");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/scores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: id, stage_id: stageIdScore, score }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal simpan nilai");
      setMsg(`Nilai tersimpan. Rata-rata: ${json.meta.final_score}/100`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal simpan");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Hapus data pelamar ini?")) return;
    const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/pelamar");
    else {
      const json = await res.json();
      setError(json.error || "Gagal hapus");
    }
  }

  if (!detail && !error) {
    return <p className="text-sm text-slate-500">Memuat…</p>;
  }

  if (!detail) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
    );
  }

  const scoreableStages = stages.filter((s) => s.name !== "DIKIRIM");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <a href="/admin/pelamar" className="text-sm font-medium text-red-600 hover:underline">
            ← Daftar pelamar
          </a>
          <h1 className="mt-1 text-xl font-bold text-slate-900">{detail.full_name}</h1>
          <p className="font-mono text-sm text-slate-500">{detail.registration_code}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white px-4 py-2 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">Nilai Akhir</p>
            <p className="text-2xl font-bold tabular-nums text-slate-900">
              {detail.final_score !== null ? `${detail.final_score}` : "—"}
              <span className="text-sm font-medium text-slate-500">/100</span>
            </p>
          </div>
          <button type="button" onClick={remove} className="btn-secondary !border-red-200 !text-red-600">
            Hapus
          </button>
        </div>
      </div>

      {msg && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{msg}</div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Progres Lamaran</h2>
            <label className="label" htmlFor="stage">
              Tahap saat ini
            </label>
            <select id="stage" className="input" value={stageId} onChange={(e) => changeStage(e.target.value)}>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {detail.logs.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Riwayat</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {detail.logs.slice(0, 5).map((log) => (
                    <li key={log.id}>
                      {new Date(log.created_at).toLocaleString("id-ID")} —{" "}
                      {log.from_stage?.name || "—"} → {log.to_stage.name}
                      {log.admin ? ` (${log.admin.username})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Penilaian (0–100)</h2>
            <p className="mb-3 text-sm text-slate-600">
              Nilai akhir = rata-rata seluruh nilai yang sudah diisi.
            </p>
            <div className="space-y-3">
              {scoreableStages.map((s) => (
                <div key={s.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="w-40 text-sm font-medium text-slate-800">{s.name}</span>
                  <input
                    className="input sm:max-w-[120px]"
                    type="number"
                    min={0}
                    max={100}
                    value={scoreInputs[s.id] ?? ""}
                    onChange={(e) => setScoreInputs((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    placeholder="0-100"
                  />
                  <button type="button" className="btn-secondary !py-2 text-xs" onClick={() => saveScore(s.id)} disabled={saving}>
                    Simpan
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Data Diri</h2>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <Info label="No KTP" value={detail.nik} />
              <Info label="No KK" value={detail.kk_number} />
              <Info label="Nama Ibu" value={detail.mother_name} />
              <Info label="Telpon" value={`${detail.phone1}${detail.phone2 ? ` / ${detail.phone2}` : ""}`} />
              <Info label="Lahir" value={`${detail.birth_place}, ${new Date(detail.birth_date).toLocaleDateString("id-ID")}`} />
              <Info label="Gender" value={detail.gender} />
              <Info label="Email" value={detail.email} />
              <Info label="Status" value={detail.marital_status} />
              <Info label="Agama" value={detail.religion} />
              <Info label="Difabel" value={detail.disability} />
              <Info label="Info Lowongan" value={detail.info_source} />
              <Info label="Pernah Yazaki" value={detail.worked_yazaki ? "Ya" : "Tidak"} />
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Pendidikan & Alamat</h2>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <Info label="Pendidikan" value={detail.education} />
              <Info label="Jurusan" value={detail.major} />
              <Info label="Sekolah" value={detail.school_name} />
              <Info label="IPK" value={detail.gpa} />
              <Info label="Provinsi" value={detail.province} />
              <Info label="Kab/Kota" value={detail.regency} />
              <Info label="Kecamatan" value={detail.district} />
              <Info label="Kelurahan" value={`${detail.village} (${detail.postal_code})`} />
            </dl>
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-medium">Alamat:</span> {detail.address}
            </p>
          </section>

          {detail.experiences.length > 0 && (
            <section className="card p-5">
              <h2 className="mb-3 font-semibold text-slate-900">Pengalaman Kerja</h2>
              <ul className="space-y-2 text-sm">
                {detail.experiences.map((exp) => (
                  <li key={exp.id} className="rounded-md bg-slate-50 px-3 py-2">
                    <span className="font-medium text-slate-900">{exp.position}</span> — {exp.company_name}
                    {exp.year_range ? <span className="text-slate-500"> · {exp.year_range}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Lowongan</h2>
            <p className="text-sm font-medium text-slate-900">{detail.lowongan.title}</p>
            <p className="text-sm text-slate-600">{detail.lowongan.placement}</p>
            <p className="mt-1 text-xs text-slate-500">Periode {detail.periode}</p>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Dokumen</h2>
            <div className="space-y-2 text-sm">
              <DocLink label="CV" url={detail.cv_url} />
              <DocLink label="Ijazah" url={detail.ijazah_url} />
              <DocLink label="Foto 3x4" url={detail.foto_url} />
            </div>
            {detail.foto_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={detail.foto_url}
                alt="Foto 3x4 pelamar"
                className="mt-3 h-28 w-21 rounded border border-slate-200 object-cover"
                style={{ width: "84px", height: "112px" }}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value || "—"}</dd>
    </div>
  );
}

function DocLink({ label, url }: { label: string; url?: string | null }) {
  if (!url) {
    return (
      <p className="text-slate-500">
        {label}: tidak ada
      </p>
    );
  }
  const href = url.includes("cloudinary.com")
    ? `/api/documents?url=${encodeURIComponent(url)}`
    : url;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-md bg-slate-50 px-3 py-2 font-medium text-red-600 hover:bg-slate-100"
    >
      Buka {label} ↗
    </a>
  );
}

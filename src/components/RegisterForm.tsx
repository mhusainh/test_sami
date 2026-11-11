"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Lowongan = { id: string; code: string; title: string; placement: string; period: string; qualification: string };

type FileState = { url: string; publicId: string } | null;

const GENDER = ["LAKI - LAKI", "PEREMPUAN"] as const;
const INFO_SOURCE = ["WEBSITE", "TEMAN", "KELUARGA", "MEDIA SOSIAL"] as const;
const DISABILITY = ["Normal", "Tuna Rungu", "Tuna Daksa", "Tuna Wicara"] as const;
const MARITAL = ["SINGLE", "MENIKAH", "JANDA", "DUDA"] as const;
const RELIGION = ["ISLAM", "KRISTEN", "KATOLIK", "KONGHUCU", "BUDDHA", "HINDU"] as const;
const EDUCATION = [
  "SMA",
  "SMK",
  "D1 (DIPLOMA 1)",
  "D2 (DIPLOMA 2)",
  "D3 (DIPLOMA 3)",
  "D4 (DIPLOMA 4)",
  "S1 (SARJANA)",
  "S2 (MAGISTER)",
] as const;

type ExperienceRow = { companyName: string; position: string; yearRange: string; description: string };

async function uploadFile(file: File, module: string): Promise<{ url: string; publicId: string }> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("module", module);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Upload gagal");
  return json.data;
}

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";
  const periodeParam = searchParams.get("periode") || "";

  const [jobs, setJobs] = useState<Lowongan[]>([]);
  const [jobId, setJobId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ code: string } | null>(null);

  const [cv, setCv] = useState<FileState>(null);
  const [ijazah, setIjazah] = useState<FileState>(null);
  const [foto, setFoto] = useState<FileState>(null);
  const [uploading, setUploading] = useState<{ cv?: boolean; ijazah?: boolean; foto?: boolean }>({});

  const [experiences, setExperiences] = useState<ExperienceRow[]>([
    { companyName: "", position: "", yearRange: "", description: "" },
  ]);

  const selected = useMemo(() => jobs.find((j) => j.id === jobId) || null, [jobs, jobId]);
  const periode = selected?.period || periodeParam;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/public/lowongan${code ? `?code=${encodeURIComponent(code)}` : ""}`);
        const json = await res.json();
        const list: Lowongan[] = json.data || [];
        setJobs(list);
        if (list.length) {
          const match = list.find((j) => j.code === code) || list[0];
          setJobId(match.id);
        }
      } catch {
        setError("Gagal memuat daftar lowongan");
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  async function handleFile(
    e: React.ChangeEvent<HTMLInputElement>,
    module: "cv" | "ijazah" | "foto",
    setter: (v: FileState) => void
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading((s) => ({ ...s, [module]: true }));
    try {
      const result = await uploadFile(file, module);
      setter(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
      e.target.value = "";
    } finally {
      setUploading((s) => ({ ...s, [module]: false }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!selected) {
      setError("Pilih lowongan terlebih dahulu");
      return;
    }
    if (!cv || !ijazah || !foto) {
      setError("CV, Ijazah, dan Foto 3x4 wajib diunggah");
      return;
    }

    const formEl = e.currentTarget;
    const fd = new FormData(formEl);

    const payload: Record<string, unknown> = {
      lowonganId: selected.id,
      periode,
      experiences: experiences.filter((x) => x.companyName && x.position),
    };
    for (const [k, v] of fd.entries()) {
      if (k === "file" || k.startsWith("_")) continue;
      payload[k] = v;
    }
    payload.workedYazaki = String(payload.workedYazaki || "Tidak");
    payload.cv_url = cv.url;
    payload.cv_public_id = cv.publicId;
    payload.ijazah_url = ijazah.url;
    payload.ijazah_public_id = ijazah.publicId;
    payload.foto_url = foto.url;
    payload.foto_public_id = foto.publicId;

    setSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal submit");
      setSuccess({ code: json.data.registration_code });
      formEl.reset();
      setCv(null);
      setIjazah(null);
      setFoto(null);
      setExperiences([{ companyName: "", position: "", yearRange: "", description: "" }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="card p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-600">Berhasil</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Lamaran terkirim</h1>
          <p className="mt-3 text-sm text-slate-600">Simpan kode pendaftaran Anda untuk pengecekan status:</p>
          <p className="mt-3 inline-block rounded-md bg-slate-100 px-4 py-2 font-mono text-lg font-bold text-slate-900">
            {success.code}
          </p>
          <div className="mt-6">
            <a href="/" className="btn-secondary">
              Kembali ke daftar lowongan
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <a href="/" className="text-sm font-medium text-red-600 hover:underline">
        ← Kembali
      </a>
      <header className="mt-4 border-b border-slate-200 pb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Form Pendaftaran</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          {selected ? selected.title : "Daftar Lowongan"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {selected?.placement ? `${selected.placement} · ` : ""}
          Periode {periode || "-"}
        </p>
      </header>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Lowongan</h2>
          <div>
            <label className="label" htmlFor="lowonganId">
              Pilih Lowongan
            </label>
            <select
              id="lowonganId"
              className="input"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              required
              disabled={loading}
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} — {j.placement}
                </option>
              ))}
            </select>
          </div>
          {selected && (
            <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium">Kualifikasi:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {selected.qualification.split("\n").filter(Boolean).map((l, i) => (
                  <li key={i}>{l.replace(/^-\s*/, "")}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Data Diri</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="fullName" label="Nama Lengkap" required />
            <Field name="nik" label="No KTP" required pattern="\d{16}" maxLength={16} />
            <Field name="kkNumber" label="No KK" required pattern="\d{16}" maxLength={16} />
            <Field name="motherName" label="Nama Ibu" required />
            <Field name="phone1" label="Telpon 1" required type="tel" />
            <Field name="phone2" label="Telpon 2" type="tel" />
            <Field name="birthPlace" label="Tempat Lahir" required />
            <Field name="birthDate" label="Tanggal Lahir" required type="date" />
            <SelectField name="gender" label="Jenis Kelamin" options={[...GENDER]} required />
            <SelectField name="infoSource" label="Info Lowongan Kerja" options={[...INFO_SOURCE]} required />
            <SelectField name="disability" label="Difabel" options={[...DISABILITY]} required />
            <SelectField name="workedYazaki" label="Pernah Bekerja di Yazaki Group" options={["Ya", "Tidak"]} required defaultValue="Tidak" />
            <SelectField name="maritalStatus" label="Status" options={[...MARITAL]} required />
            <Field name="email" label="Email" required type="email" />
            <SelectField name="religion" label="Agama" options={[...RELIGION]} required />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pendidikan</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField name="education" label="Pendidikan" options={[...EDUCATION]} required />
            <Field name="major" label="Jurusan" required />
            <Field name="schoolName" label="Nama Sekolah / Universitas" required />
            <Field name="gpa" label="IPK / Nilai Rata-rata" required />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Alamat</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="province" label="Provinsi" required />
            <Field name="regency" label="Kabupaten/Kota" required />
            <Field name="district" label="Kecamatan" required />
            <Field name="village" label="Kelurahan" required />
            <Field name="postalCode" label="Kode Pos" required />
          </div>
          <div>
            <label className="label" htmlFor="address">
              Alamat <span className="text-red-600">*</span>
            </label>
            <textarea id="address" name="address" rows={3} className="input" required />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Pengalaman Kerja
            </h2>
            <button
              type="button"
              className="btn-secondary !py-1.5 text-xs"
              onClick={() =>
                setExperiences((rows) => [
                  ...rows,
                  { companyName: "", position: "", yearRange: "", description: "" },
                ])
              }
            >
              + Tambah
            </button>
          </div>
          {experiences.map((row, idx) => (
            <div key={idx} className="rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pengalaman {idx + 1}</span>
                {experiences.length > 1 && (
                  <button
                    type="button"
                    className="text-xs font-medium text-red-600 hover:underline"
                    onClick={() => setExperiences((rows) => rows.filter((_, i) => i !== idx))}
                  >
                    Hapus
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input"
                  placeholder="Nama Perusahaan"
                  value={row.companyName}
                  onChange={(e) =>
                    setExperiences((rows) =>
                      rows.map((r, i) => (i === idx ? { ...r, companyName: e.target.value } : r))
                    )
                  }
                />
                <input
                  className="input"
                  placeholder="Posisi"
                  value={row.position}
                  onChange={(e) =>
                    setExperiences((rows) =>
                      rows.map((r, i) => (i === idx ? { ...r, position: e.target.value } : r))
                    )
                  }
                />
                <input
                  className="input"
                  placeholder="Tahun (mis. 2020-2023)"
                  value={row.yearRange}
                  onChange={(e) =>
                    setExperiences((rows) =>
                      rows.map((r, i) => (i === idx ? { ...r, yearRange: e.target.value } : r))
                    )
                  }
                />
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dokumen</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <FileField
              id="cv"
              label="CV (PDF, maks 5MB)"
              accept=".pdf,application/pdf"
              uploading={Boolean(uploading.cv)}
              done={Boolean(cv)}
              onChange={(e) => handleFile(e, "cv", setCv)}
            />
            <FileField
              id="ijazah"
              label="Ijazah (PDF/JPG/PNG, maks 5MB)"
              accept=".pdf,image/*"
              uploading={Boolean(uploading.ijazah)}
              done={Boolean(ijazah)}
              onChange={(e) => handleFile(e, "ijazah", setIjazah)}
            />
            <FileField
              id="foto"
              label="Foto 3x4 (JPG/PNG, maks 2MB)"
              accept="image/*"
              uploading={Boolean(uploading.foto)}
              done={Boolean(foto)}
              onChange={(e) => handleFile(e, "foto", setFoto)}
            />
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <a href="/" className="btn-secondary">
            Kembali
          </a>
          <button type="submit" className="btn-primary" disabled={submitting || loading}>
            {submitting ? "Mengirim…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  required,
  type = "text",
  pattern,
  maxLength,
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  pattern?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        pattern={pattern}
        maxLength={maxLength}
        className="input"
      />
    </div>
  );
}

function SelectField({
  name,
  label,
  options,
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  options: string[];
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <select id={name} name={name} required={required} defaultValue={defaultValue || options[0]} className="input">
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function FileField({
  id,
  label,
  accept,
  uploading,
  done,
  onChange,
}: {
  id: string;
  label: string;
  accept: string;
  uploading: boolean;
  done: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label} <span className="text-red-600">*</span>
      </label>
      <input id={id} type="file" accept={accept} onChange={onChange} className="input !p-2" required={false} />
      <p className="mt-1 text-xs">
        {uploading ? (
          <span className="text-amber-600">Mengunggah…</span>
        ) : done ? (
          <span className="text-green-600">Terunggah ✓</span>
        ) : (
          <span className="text-slate-500">Belum ada file</span>
        )}
      </p>
    </div>
  );
}

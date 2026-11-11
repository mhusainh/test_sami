# PRD — Sistem Rekrutmen Online (Test SAMI)

| | |
|---|---|
| Nama project | `test_sami` — Website Jobseeker & Back Office HRD |
| Versi | 1.0 |
| Tanggal | 2026-11-11 |
| Status | Draft / Siap dibangun |

---

## 1. Ringkasan Produk

Sistem rekrutmen online terdiri dari dua sisi dalam satu website Next.js:

1. **Publik (Pelamar)** — tanpa login. Pelamar membuka website, memilih lowongan, mengisi form pendaftaran, mengunggah CV / Ijazah / Foto 3x4, lalu submit lamaran.
2. **Back Office HRD (Admin)** — perlu login. HRD mengelola data lowongan (CRUD), melihat daftar pelamar, mengubah progres pelamar (drag & drop), memberi nilai tiap tahap test, dan mengekspor data pelamar ke Excel.

Alur utama pelamar:

```text
Pilih Lowongan → Isi Form + Upload Dokumen → Submit (status: DIKIRIM)
  → Psikotest → Wawancara → Diterima / Ditolak
```

---

## 2. Persona

### 2.1 Pelamar (Applicant)

- Membuka link website / link lowongan (contoh: `/?code=opt&title=operator&periode=202505`).
- Tidak perlu membuat akun. Cukup isi form dan submit.
- Mengunggah dokumen wajib: CV, Ijazah, Foto 3x4.

### 2.2 HRD / Admin Back Office

- Login dengan username & password (satu level: `hrd` / admin).
- Mengelola lowongan, memantau pelamar, mengatur pipeline seleksi, memberi nilai, export Excel.

---

## 3. Ruang Lingkup Fitur (Scope)

### 3.1 Sisi Pelamar (Publik)

| ID | Fitur | Keterangan |
|----|-------|-------------|
| P-01 | Halaman daftar lowongan | Tabel/modal lowongan: **Job**, **Penempatan**, **Kualifikasi**, tombol **Daftar**. Referensi UI: dialog "Lowongan Kerja SAMI-JF" (Operator OPT, Penyandang Disabilitas). |
| P-02 | Link lowongan berparameter | Mendukung query `?code=&title=&periode=` seperti `sami.co.id/recruitment-apply?code=opt&title=operator&periode=202505`. Jika kode cocok, form langsung terbuka untuk lowongan tersebut. |
| P-03 | Form pendaftaran | Isian mengikuti form SAMI (lihat §5.1) + unggahan dokumen. |
| P-04 | Upload dokumen | **CV** (PDF), **Ijazah** (PDF/JPG/PNG), **Foto 3x4** (JPG/PNG). Disimpan ke Cloudinary prefix `test_sami/`. |
| P-05 | Submit lamaran | Validasi client + server. Setelah sukses, tampilkan konfirmasi (kode pelamar / nomor pendaftaran). Status awal: `DIKIRIM`. |
| P-06 | Cek status (opsional v1.1) | Pelamar bisa melihat progres berdasarkan kode pendaftaran + No KTP/email. |

### 3.2 Back Office HRD (Login)

| ID | Fitur | Keterangan |
|----|-------|------------|
| A-01 | Login / Logout | Session cookie aman. Rate-limit login sederhana. Default akun dibuat saat seed. |
| A-02 | CRUD Lowongan | Field: **Job** (nama + kode), **Penempatan**, **Kualifikasi** (multiline), status aktif/nonaktif, periode. |
| A-03 | Daftar pelamar | Tabel filter & search: nama, kode lowongan, status progres, periode. Detail pelamar: semua isian + preview/download CV, Ijazah, Foto. |
| A-04 | Export Excel | Download `.xlsx` daftar pelamar (filter aktif ikut ter-export). Kolom: identitas, pendidikan, alamat, lowongan, progres, nilai rata-rata, link dokumen. |
| A-05 | Kelola tahap progres | Tabel **sendiri** untuk daftar tahap. Default: `DIKIRIM → PSIKOTEST → WAWANCARA → DITERIMA`. Bisa **tambah / hapus / rename** tahap. **Urutan diubah via drag & drop.** |
| A-06 | Ubah progres pelamar | Pindahkan pelamar antar tahap (dropdown atau geser kartu di board). Riwayat perubahan disimpan (audit log ringan). |
| A-07 | Penilaian test | HRD memberi nilai per tahap (mis. Psikotest, Wawancara) untuk tiap pelamar. Skala input 0–100. |
| A-08 | Nilai akhir | **Rata-rata** seluruh nilai tahap yang sudah dinilai → skor `/100`. Ditampilkan di detail & tabel pelamar. Rumus: `round(sum(nilai) / jumlah_tahap_dinilai)`. |
| A-09 | Hapus / tolak pelamar | Hapus data (soft-delete opsional) atau tandai ditolak dengan catatan. |

### 3.3 Di Luar Scope (v1)

- Email notifikasi / OTP.
- Test psikotest online interaktif (nilai diinput manual HRD).
- Multi-tenant multi-cabang dengan hak akses berbeda (cukup 1 role HRD).
- Mobile native app.

---

## 4. Tech Stack

| Lapisan | Teknologi |
|---------|-----------|
| Framework | **Next.js 14** (App Router) + **React 18** + **TypeScript** |
| Styling | **Tailwind CSS** (+ komponen UI disusun **terakhir**, lihat AGENT.md) |
| ORM | **Prisma 5** (`prisma-client-js`) |
| Database | **Supabase PostgreSQL** (pooler transaction `:6543` untuk app, direct `:5432` untuk migrate) |
| Media storage | **Cloudinary** — prefix/folder root **`test_sami/`** |
| Auth HRD | Cookie session (signed, HttpOnly) + `bcryptjs` untuk `password_hash` |
| Export Excel | `exceljs` atau `xlsx` (SheetJS) |
| Drag & drop reorder | `@dnd-kit/core` + `@dnd-kit/sortable` (rekomendasi) atau `react-beautiful-dnd` |

### 4.1 Konfigurasi Environment (`.env.local`)

```env
# Supabase Postgres — password: @test_sami123 (encode @ → %40 di URL)
DATABASE_URL="postgresql://postgres.hahqtxlrxxvrhrqwkvym:%40test_sami123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.hahqtxlrxxvrhrqwkvym:%40test_sami123@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Cloudinary (ikuti kredensial project Portfolio, ganti folder ke test_sami/)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dz3ycetrd
CLOUDINARY_API_KEY=921149717414427
CLOUDINARY_API_SECRET=r2qpVHPvrhnjbt057Nwe3RYs5xs

# App
SESSION_SECRET=<random-secret>
```

> Catatan password: karakter `@` **wajib** di-encode `%40` di dalam connection string Supabase/Prisma, bukan ditulis literal.

### 4.2 Prisma Init (sesuai instruksi user)

```bash
npm install prisma --save-dev
npx prisma init
npx skills add supabase/agent-skills   # optional
```

`prisma/schema.prisma` dasar:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 4.3 Cloudinary Prefix `test_sami/`

Port pola dari `Portfolio/src/lib/cloudinary.ts` + `/api/upload`, ganti root folder:

```text
test_sami/cv/         → CV (PDF, resource_type: raw)
test_sami/ijazah/     → Ijazah (PDF/image)
test_sami/foto/       → Foto 3x4 (image)
test_sami/lowongan/   → Logo/banner lowongan (opsional)
```

Upload tetap via **API route server** (`/api/upload`) agar API secret tidak bocor ke client.

---

## 5. Spesifikasi Fitur Detail

### 5.1 Form Pendaftaran Pelamar (referensi isian saja)

> **Catatan:** URL `https://www.sami.co.id/recruitment-apply?...` hanya diambil sebagai **daftar field/isian** yang perlu ada (lihat tabel di bawah). **UI/tampilan form tidak di-copy** — desain visual dibuat sendiri di fase UI terakhir dengan skills yang tersedia.

**Header context:** kode lowongan, judul/periode (dari query URL atau dipilih).

**A. Data diri**

| Field | Tipe | Wajib |
|-------|------|-------|
| Kode lowongan | text (readonly dari URL/pilihan) | Ya |
| Periode | text/readonly | Ya |
| Nama Lengkap | text | Ya |
| No KTP | text (16 digit) | Ya |
| No KK | text (16 digit) | Ya |
| Nama Ibu | text | Ya |
| Telpon 1 | tel | Ya |
| Telpon 2 | tel | Tidak |
| Tempat Lahir | text | Ya |
| Tanggal Lahir | date | Ya |
| Jenis Kelamin | select: `LAKI - LAKI`, `PEREMPUAN` | Ya |
| Info Lowongan Kerja | select: `WEBSITE`, `TEMAN`, `KELUARGA`, `MEDIA SOSIAL` | Ya |
| Difabel | select: `Normal`, `Tuna Rungu`, `Tuna Daksa`, `Tuna Wicara` | Ya |
| Pernah Bekerja di Yazaki Group | select: `Ya`, `Tidak` | Ya |
| Status | select: `SINGLE`, `MENIKAH`, `JANDA`, `DUDA` | Ya |
| Email | email | Ya |
| Agama | select: `ISLAM`, `KRISTEN`, `KATOLIK`, `KONGHUCU`, `BUDDHA`, `HINDU` | Ya |

**B. Pendidikan**

| Field | Tipe | Wajib |
|-------|------|-------|
| Pendidikan | select: `SMA`, `SMK`, `D1`–`D4`, `S1`, `S2` | Ya |
| Jurusan | text | Ya |
| Nama Sekolah / Universitas | text | Ya |
| IPK / Nilai Rata-rata | number (0–4 atau 0–100, simpan sebagai string/decimal) | Ya |

**C. Alamat**

| Field | Tipe | Wajib |
|-------|------|-------|
| Provinsi | text/select | Ya |
| Kabupaten/Kota | text/select | Ya |
| Kecamatan | text | Ya |
| Kelurahan | text | Ya |
| Kode Pos | text | Ya |
| Alamat | textarea | Ya |

**D. Pengalaman Kerja**

| Field | Tipe | Wajib |
|-------|------|-------|
| Pengalaman | repeater rows: `Nama Perusahaan`, `Posisi`, `Tahun` (opsional keterangan) | Tidak |

**E. Upload dokumen (ditambahkan dari brief)**

| Field | Format | Maks | Wajib |
|-------|--------|------|-------|
| CV | PDF | 5 MB | Ya |
| Ijazah | PDF / JPG / PNG | 5 MB | Ya |
| Foto 3x4 | JPG / PNG, rasio 3:4 | 2 MB | Ya |

### 5.2 Data Lowongan (CRUD HRD)

| Field | Keterangan |
|-------|------------|
| `code` | Kode unik, dipakai di URL: `opt`, `difable`, dst. |
| `title` | Nama job: `Operator (OPT)`, `Penyandang Disabilitas (Difable)`, dst. |
| `placement` | Penempatan: `SAMI Jepara`, `SAMI Tugu`, dst. |
| `qualification` | Kualifikasi multiline (bullet `- ...`) |
| `period` | Periode lowongan: `202505` |
| `is_active` | Tampil/tidak di halaman publik |
| `sort_order` | Urutan tampil |

Kolom yang wajib ada di daftar lowongan publik (dari referensi gambar — bukan meniru UI-nya):

```text
| Job                    | Penempatan  | Kualifikasi              | Pendaftaran |
| Operator (OPT)         | SAMI Jepara | - Wanita SMA/SMK ...     | [Daftar]    |
| Penyandang Disabilitas | SAMI Jepara | - Pria/Wanita ...        | [Daftar]    |
```

### 5.3 Pipeline Progres (fleksibel, tabel sendiri, drag & drop)

**Tabel terpisah** `application_stages` (bukan hardcode enum):

| Kolom | Keterangan |
|-------|------------|
| `id` | uuid |
| `name` | Nama tahap: `DIKIRIM`, `PSIKOTEST`, `WAWANCARA`, `DITERIMA` |
| `order` | integer — urutan tampil & alur |
| `is_terminal` | opsional: tahap akhir (Diterima/Ditolak) |
| `created_at` | timestamp |

- **Default seed:** `DIKIRIM (1) → PSIKOTEST (2) → WAWANCARA (3) → DITERIMA (4)`.
- HRD bisa **tambah tahap** (mis. `USER INTERVIEW`, `MEDICAL`), **rename**, **hapus** (jika tidak dipakai pelamar), dan **mengubah urutan via drag & drop** → PATCH bulk `[{id, order}, ...]`.
- Field pelamar menyimpan `current_stage_id` (FK ke tabel tahap) + `application_stages_orders` tidak perlu — urutan selalu dibaca dari `order` tahap.
- UI: halaman **Settings → Tahap Progres** berisi sortable list (dnd). Board kanban pelamar mengikuti urutan tahap yang sama.

### 5.4 Penilaian & Nilai Akhir `/100`

**Tabel** `application_scores`:

| Kolom | Keterangan |
|-------|------------|
| `application_id` | FK pelamar |
| `stage_id` | FK tahap (nilaian per tahap test) |
| `score` | decimal/float 0–100 |
| `notes` | catatan HRD (opsional) |
| `created_by` | FK admin |
| `created_at` / `updated_at` | timestamp |

- HRD input nilai di detail pelamar: per tahap (yang dianggap test) satu nilai 0–100.
- **Nilai akhir** = rata-rata seluruh baris `application_scores` untuk pelamar itu:

```text
final_score = round( average(score) )   // 0–100
```

- Jika belum ada nilai → tampilkan `—`.
- Nilai akhir tampil di tabel pelamar, detail, dan kolom export Excel.

### 5.5 Export Excel

- Endpoint: `GET /api/applications/export` (hanya HRD, session valid).
- Query filter sama dengan tabel di UI: `?q=&stage=&job=&period=`.
- Library: `exceljs` (rekomendasi) atau `xlsx`.
- Nama file: `pelamar-{kodeLowongan|semua}-{YYYYMMDD}.xlsx`.
- Kolom minimal:

```text
No | Kode Pelamar | Nama | No KTP | Email | Telpon | Lowongan | Penempatan |
Periode | Progres | Nilai Akhir | Pendidikan | Sekolah | IPK | Alamat |
CV (link) | Ijazah (link) | Foto (link) | Tanggal Daftar
```

### 5.6 Autentikasi HRD

- Tabel `admin_users` (id, username unique, password_hash bcrypt, name, created_at).
- `POST /api/auth/login` → set cookie `session` signed (HMAC `SESSION_SECRET`, HttpOnly, SameSite=Lax, path `/`).
- Middleware (`src/middleware.ts`) melindungi prefix `/admin`, `/api` privat (kecuali `api/auth/login`, `api/applications` publik POST, `api/upload` yang hanya dari form publik — pertimbangkan honeypot/rate-limit).
- Seed 1 akun default (username `hrd`, password di-hash saat seed — catat di AGENT.md).

---

## 6. Model Data (Prisma — ringkas)

```text
admin_users          — akun HRD
lowongan             — data lowongan/job posting (CRUD)
application_stages   — daftar tahap progres (fleksibel + order)
applications         — data lamaran pelamar (semua isian form + stage_id + kode unik)
application_scores   — nilai per tahap per pelamar
application_logs     — riwayat perubahan tahap (opsional tapi disarankan)
pengalaman_kerja     — rows pengalaman per application (repeater)
```

Relasi penting:

```text
lowongan 1—* applications
application_stages 1—* applications (current_stage_id)
applications 1—* application_scores *1 application_stages
applications 1—* pengalaman_kerja
applications 1—* application_logs
```

Field dokumen di `applications`: `cv_url`, `ijazah_url`, `foto_url` (+ `public_id` masing-masing bila perlu hapus dari Cloudinary).

---

## 7. Struktur Route (rencana)

```text
/                          — Landing + daftar lowongan (publik)
/?code=opt&title=...       — Form pendaftaran untuk lowongan tsb
/daftar/[code]             — alternatif path form
/login                     — Login HRD
/admin                     — Dashboard HRD (ringkasan)
/admin/lowongan            — CRUD lowongan
/admin/pelamar             — Tabel pelamar + filter + export Excel
/admin/pelamar/[id]        — Detail: isian, dokumen, ubah tahap, nilai
/admin/tahap               — Kelola tahap progres (drag & drop)
/api/auth/login|logout
/api/lowongan              — CRUD (admin) + list aktif (publik)
/api/applications          — POST (publik submit), GET (admin list)
/api/applications/[id]     — GET/PATCH/DELETE (admin)
/api/applications/export   — GET xlsx (admin)
/api/stages                — GET, POST, PATCH bulk order, DELETE (admin)
/api/scores                — GET/PUT (admin)
/api/upload                — POST multipart → Cloudinary (prefix test_sami/)
```

---

## 8. Milestone / Urutan Pengerjaan

| # | Fase | Isi | Keterangan |
|---|------|-----|------------|
| 1 | Setup | Next.js + TS + Tailwind + Prisma init + env Supabase/Cloudinary + prisma generate | |
| 2 | Schema & Seed | Semua model Prisma, migrate via `DIRECT_URL`, seed admin + 4 tahap default + 2 lowongan contoh (OPT & Difable) | |
| 3 | Core API | Auth login/logout, CRUD lowongan, submit pelamar, upload Cloudinary, stages CRUD+reorder, scores, export Excel | |
| 4 | Halaman fungsional | Form publik, login, dashboard admin, tabel pelamar, detail pelamar, halaman tahap (dnd) | Struktur & fungsi dulu |
| 5 | **UI polish (TERAKHIR)** | Seluruh skills UI/UX dimuat & diterapkan (lihat AGENT.md §UI) | Hanya setelah fase 1–4 jalan |

---

## 9. Kriteria Penerimaan (Acceptance)

- [ ] Pelamar bisa submit lamaran lengkap + 3 file terupload di Cloudinary folder `test_sami/*`, status awal = tahap pertama.
- [ ] HRD hanya bisa akses `/admin` setelah login; logout berfungsi.
- [ ] CRUD lowongan berfungsi (tambah, ubah, hapus, aktif/nonaktif) dan tampil di halaman publik.
- [ ] Tabel tahap bisa ditambah, dihapus, rename, dan **urutannya berubah via drag & drop** serta persist setelah reload.
- [ ] HRD bisa memindahkan pelamar antar tahap; perubahan tercatat.
- [ ] HRD bisa input nilai 0–100 per tahap; nilai akhir = rata-rata tampil `/100`.
- [ ] Export Excel menghasilkan `.xlsx` berisi data + filter yang aktif.
- [ ] `npm run build` lulus tanpa error TypeScript.
- [ ] UI dikerjakan di fase terakhir dengan seluruh skills UI/UX yang tersedia.

---

## 10. Referensi

- Form pendaftar — **hanya referensi isian/field, bukan UI**: `https://www.sami.co.id/recruitment-apply?code=opt&title=operator&periode=202505`
- Dialog lowongan — **hanya referensi kolom isian** (Job / Penempatan / Kualifikasi / Pendaftaran), bukan UI.
- Pola kode referensi: `C:\Users\NITRO 5\Documents\GitHub\Portfolio`
  - `src/lib/cloudinary.ts`, `src/app/api/upload/route.ts`
  - `src/lib/prisma.ts`, `src/app/api/auth/login/route.ts`
  - `prisma/schema.prisma`, `AGENTS.md` (mandat UI/UX)

# AGENT.md — Instruksi Agent untuk Project `test_sami`

Dokumen ini adalah panduan wajib bagi AI agent / developer yang mengerjakan project **Sistem Rekrutmen Online (test_sami)**. Baca `PRD.md` untuk spesifikasi fitur; dokumen ini mengatur **cara kerja, konvensi, dan urutan pengerjaan**.

---

## 1. Konteks Project

- **Repo:** `C:\Users\NITRO 5\Documents\GitHub\test_sami`
- **Produk:** Website jobseeker — sisi publik (pelamar, tanpa login) + Back Office HRD (login, CRUD lamaran, pipeline progres, penilaian, export Excel).
- **Bahasa UI & dokumen:** Indonesia (label, copy, komentar bila perlu).

---

## 2. Tech Stack (tetap, jangan ganti)

| Lapisan | Pilihan |
|---------|---------|
| Language | TypeScript (strict) |
| Framework | Next.js 14 App Router + React 18 |
| Styling | Tailwind CSS |
| ORM | Prisma 5 (`prisma-client-js`) |
| Database | Supabase PostgreSQL |
| Media | Cloudinary — **prefix root `test_sami/`** |
| Auth HRD | Cookie session signed (HMAC) + `bcryptjs` |
| Export Excel | `exceljs` (atau `xlsx`) |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/sortable` (utamakan dnd-kit; ringan & actively maintained) |

### 2.1 Instruksi ORM (dari user — ikuti persis)

```bash
npm install prisma --save-dev
npx prisma init
npx skills add supabase/agent-skills   # optional
```

`prisma/schema.prisma`:

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

### 2.2 `.env.local`

```env
# Password Supabase: @test_sami123 → encode @ jadi %40 di connection string
DATABASE_URL="postgresql://postgres.hahqtxlrxxvrhrqwkvym:%40test_sami123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.hahqtxlrxxvrhrqwkvym:%40test_sami123@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dz3ycetrd
CLOUDINARY_API_KEY=921149717414427
CLOUDINARY_API_SECRET=r2qpVHPvrhnjbt057Nwe3RYs5xs

SESSION_SECRET=<acak-panjang-min-32-char>
```

Aturan:
- `DATABASE_URL` = pooler **transaction :6543** (query runtime, `?pgbouncer=true`).
- `DIRECT_URL` = **session :5432** (hanya `prisma migrate`).
- Migrate **wajib** lewat `directUrl` (Prisma otomatis pakai ini).
- Jangan commit `.env.local` — sediakan `.env.example` tanpa secret.

### 2.3 Referensi isian form (bukan UI)

- Form SAMI (`https://www.sami.co.id/recruitment-apply?code=opt&title=operator&periode=202505`) dan screenshot dialog lowongan **hanya** sebagai sumber daftar field/kolom (lihat PRD §5.1–5.2).
- **Jangan** meniru layout, styling, atau UX situs/screenshot tersebut. UI dibuat dari nol pada Fase 5 dengan seluruh skills §5.

### 2.4 Pola kode referensi (Portfolio)

Salin pola dari `C:\Users\NITRO 5\Documents\GitHub\Portfolio`, sesuaikan prefix folder:

| Referensi | Adaptasi untuk test_sami |
|-----------|--------------------------|
| `src/lib/cloudinary.ts` | `FOLDERS` → root **`test_sami/`** (lihat §4) |
| `src/app/api/upload/route.ts` | Upload multipart → `upload_stream`, PDF = `resource_type: "raw"` |
| `src/lib/prisma.ts` | Singleton PrismaClient (globalThis) — pakai apa adanya |
| `src/app/api/auth/login/route.ts` | bcrypt compare + set session cookie |
| `src/app/api/reorder/route.ts` | Pola update urutan massal → dipakai untuk reorder tahap |
| `prisma/schema.prisma` | Pola `@db.Uuid`, `@db.Timestamptz(6)`, `@@map` snake_case |

### 2.5 Cloudinary — prefix WAJIB `test_sami/`

```ts
export const FOLDERS = {
  cv: "test_sami/cv",
  ijazah: "test_sami/ijazah",
  foto: "test_sami/foto",
  lowongan: "test_sami/lowongan",
} as const;
```

- Semua upload lewat **API route server** (`/api/upload`) — `CLOUDINARY_API_SECRET` tidak boleh di client.
- Validasi di server: ukuran maks (CV/Ijazah 5 MB, foto 2 MB), mime type yang diizinkan.
- Simpan `secure_url` (+ `public_id` bila perlu) di row `applications`.

---

## 3. Database (Prisma → Supabase)

Model minimal (detail kolom di PRD §6):

```text
admin_users, lowongan, application_stages, applications,
application_scores, application_logs, pengalaman_kerja
```

Aturan:
1. Semua perubahan schema lewat **migration** (`prisma migrate dev`), jangan `db push` di main bila bisa dihindari.
2. Seed saat setup pertama:
   - 1 admin HRD (default: username `hrd`, password `@test_sami123` — hash dengan bcrypt saat seed, jangan simpan plaintext di kode).
   - 4 tahap default: `DIKIRIM` (order 1) → `PSIKOTEST` (2) → `WAWANCARA` (3) → `DITERIMA` (4).
   - 2 lowongan contoh sesuai gambar: Operator (OPT) & Penyandang Disabilitas (Difable), penempatan SAMI Jepara.
3. Tahap progres **bukan enum** — selalu row di `application_stages` dengan kolom `order` untuk drag & drop.
4. Nilai akhir dihitung di query/service: `round(avg(score))` — jangan simpan cache kecuali perlu optimasi.

---

## 4. Urutan Pengerjaan (WAJIB — logika dulu, UI terakhir)

> **Aturan utama user:** *"jangann lupa untuk ui dibuat terakhiran dan gunakan semua skills yang aku miliki terkait UI"*

### Fase 1 — Setup
1. `create-next-app` (TS, Tailwind, App Router, `src/`).
2. Install deps: `@prisma/client`, `prisma`, `cloudinary`, `bcryptjs`, `exceljs`, `@dnd-kit/core`, `@dnd-kit/sortable`, `zod` (validasi), dst.
3. `npx prisma init`, isi `.env.local` + `.env.example` (§2.2).
4. `npx prisma generate` masuk script build: `"build": "prisma generate && next build"`.

### Fase 2 — Schema + Seed + Migrate
1. Tulis semua model → `prisma migrate dev --name init`.
2. Seed: admin, tahap default, lowongan contoh.

### Fase 3 — Core API (tanpa UI polish)
1. Auth: `POST /api/auth/login`, `/api/auth/logout`, middleware proteksi `/admin` + `/api` privat.
2. Lowongan: CRUD.
3. Applications: `POST` submit publik (validasi zod + upload 3 file), `GET` list admin, `GET/PATCH/DELETE` detail.
4. Stages: CRUD + `PATCH` bulk reorder (drag & drop menyimpan array order).
5. Scores: upsert nilai per tahap → baca rata-rata.
6. Export: `GET /api/applications/export` → `.xlsx`.

### Fase 4 — Halaman fungsional (wireframe/stuktur boleh sederhana)
1. Publik: landing daftar lowongan + form pendaftaran (`?code=&title=&periode=`) + upload + success state.
2. `/login`, `/admin` shell, tabel pelamar, detail pelamar (ubah tahap + input nilai), halaman tahap dengan dnd-kit.
3. Pastikan semua acceptance PRD §9 lulus fungsional.

### Fase 5 — UI / Design (TERAKHIR — lihat §5)
Baru setelah Fase 1–4 hijau, muat **semua skills UI** dan lakukan polish menyeluruh: visual, aksesibilitas, mobile, copy, code comment.

**Jangan** menunda API/fitur karena menunggu desain sempurna. **Jangan** mulai restyle visual sebelum fitur jalan.

---

## 5. Mandat Skill UI/UX (Standing Directive)

AI agent **HARUS SELALU** memuat dan mematuhi seluruh skill UI/UX yang tersedia pada tahap **Fase 5 (dan setiap iterasi review UI)**, tanpa kecuali:

1. **Impeccable** — craft level director, standar craft-floor, verifikasi bounded pass; mode Experience untuk sisi publik / Operate untuk back office.
2. **Antislop** (mode: During) — no generic gradients, no em-dash, no fake metrics, no dead links; wajib notice mode: `antislop active: <mode> (<source>).`
3. **UI/UX Pro Max** — database rules: kontras, aksesibilitas, touch target 44px, spacing, semantic tokens, chart bila perlu.
4. **Antislop sub-skills:**
   - `antislop-ui` — variasi visual, dosis glow/shadow/radius.
   - `antislop-human` — WCAG AA 4.5:1, keyboard Tab/Enter/Escape, focus outline.
   - `antislop-layoutmobile` — mobile-first, zero horizontal overflow, thumb tap area.
   - `antislop-copywriting` — copy natural, spesifik, tanpa buzzwords.
   - `antislop-code` — komentar kode bersih, tanpa AI boilerplate.
5. **Style / taste skills** (pilih satu arah konsisten untuk project ini, mis. industrial/admin dashboard yang rapi): `design-taste-frontend`, `high-end-visual-design`, `industrial-brutalist-ui`, atau `minimalist-ui` — daftar arah di `DESIGN.md` bila dibuat.
6. Lain yang relevan bila tersedia saat sesi: `antislop-layoutmobile`, `gpt-taste` (hanya bila cocok dengan karakter HR tool).

Aturan pemanggilan:
- Untuk UI, copy, mobile, atau code comments: baca `antislop` (core) dulu, lalu sub-skill yang relevan.
- Sebelum edit UI pertama kali, umumkan mode antislop yang aktif.
- Skills dimuat via tool `skill` saat memasuki Fase 5 — jangan asumsikan ingatan lintas sesi.

---

## 6. Konvensi Kode

- **Path alias:** `@/*` → `src/*` (default Next.js TS).
- **API:** Route Handlers (`src/app/api/**/route.ts`), response JSON konsisten: `{ data }` atau `{ error }`, status HTTP benar (400/401/403/404/500).
- **Validasi:** `zod` di boundary API (server) + mirror message error ke client.
- **DB access:** hanya lewat `@/lib/prisma` — jangan `new PrismaClient()` di route.
- **Auth:** helper `getSession()` / `requireAdmin()`; middleware cek cookie; jangan percaya input client untuk role.
- **Komponen:** server components default; `"use client"` hanya untuk interaksi (form, dnd, table state).
- **Nama file:** komponen `PascalCase.tsx`, lib/util `kebab-case.ts`.
- **Tanpa hardcode secret** di source. Cloudinary & DB hanya via env.
- **Error handling:** global-error.tsx + toast/inline error di form.
- **Komentar:** ikuti `antislop-code` — komentar hanya yang menjelakan *why*, hapus komentar generik.

---

## 7. Script `package.json` (target)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "prisma db seed"
  }
}
```

Sebelum menyatakan selesai: `npm run lint` + `npm run build` harus lulus.

---

## 8. Checklist Akhir (Definition of Done)

- [ ] Semua fitur PRD §9 acceptance terpenuhi.
- [ ] `npm run build` sukses (prisma generate + next build).
- [ ] Upload 3 dokumen masuk folder Cloudinary `test_sami/*`.
- [ ] Reorder tahap persist (drag & drop → reload tetap urut).
- [ ] Export Excel bisa dibuka & kolom lengkap.
- [ ] Fase 5 UI: seluruh skills §5 dimuat dan diterapkan; antislop notice dikeluarkan.
- [ ] `.env.example` lengkap; `.env.local` tidak di-commit.
- [ ] Seed admin + tahap default + lowongan contoh berjalan ulang tanpa duplikat (idempotent bila memungkinkan).

---

## 9. Log Perubahan Dokumen

- **2026-11-11**: Inisialisasi `PRD.md` + `AGENT.md` (Next.js 14, Prisma + Supabase, Cloudinary prefix `test_sami`, pipeline tahap fleksibel drag & drop, nilai rata-rata /100, export Excel, UI terakhir dengan seluruh skills UI/UX).

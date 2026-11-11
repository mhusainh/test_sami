import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorized } from "@/lib/auth";
import { applicationFormSchema } from "@/lib/validation";
import { generateRegistrationCode } from "@/lib/code";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await requireAdmin())) return unauthorized();
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || undefined;
    const stageId = url.searchParams.get("stage") || undefined;
    const lowonganId = url.searchParams.get("job") || undefined;
    const period = url.searchParams.get("period") || undefined;

    const where = {
      ...(q
        ? {
            OR: [
              { full_name: { contains: q, mode: "insensitive" as const } },
              { registration_code: { contains: q, mode: "insensitive" as const } },
              { nik: { contains: q } },
              { email: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(stageId ? { stage_id: stageId } : {}),
      ...(lowonganId ? { lowongan_id: lowonganId } : {}),
      ...(period ? { periode: period } : {}),
    };

    const applications = await prisma.applications.findMany({
      where,
      include: {
        lowongan: true,
        stage: true,
        scores: true,
        experiences: true,
      },
      orderBy: { created_at: "desc" },
    });

    const data = applications.map((a) => {
      const scores = a.scores.map((s) => Number(s.score));
      const avg = scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : null;
      return {
        ...a,
        final_score: avg,
        score_count: scores.length,
      };
    });

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Gagal memuat pelamar" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let payload: Record<string, unknown>;

    if (contentType.includes("application/json")) {
      payload = await request.json();
    } else {
      const formData = await request.formData();
      const raw = formData.get("payload");
      if (typeof raw === "string") {
        payload = JSON.parse(raw);
      } else {
        payload = Object.fromEntries(formData.entries());
        const expRaw = formData.get("experiences");
        if (typeof expRaw === "string") payload.experiences = JSON.parse(expRaw);
      }
      for (const key of [
        "cv_url",
        "cv_public_id",
        "ijazah_url",
        "ijazah_public_id",
        "foto_url",
        "foto_public_id",
      ]) {
        const v = formData.get(key);
        if (typeof v === "string" && v) payload[key] = v;
      }
    }

    const parsed = applicationFormSchema.safeParse({
      ...payload,
      experiences: payload.experiences || [],
    });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: issue ? `${issue.path.join(".")}: ${issue.message}` : "Validasi gagal" },
        { status: 400 }
      );
    }

    const form = parsed.data;

    const lowongan = await prisma.lowongan.findUnique({ where: { id: form.lowonganId } });
    if (!lowongan || !lowongan.is_active) {
      return NextResponse.json({ error: "Lowongan tidak tersedia" }, { status: 400 });
    }

    const firstStage = await prisma.application_stages.findFirst({ orderBy: { order: "asc" } });
    if (!firstStage) {
      return NextResponse.json({ error: "Tahap belum dikonfigurasi" }, { status: 500 });
    }

    const cvUrl = typeof payload.cv_url === "string" ? payload.cv_url : null;
    const ijazahUrl = typeof payload.ijazah_url === "string" ? payload.ijazah_url : null;
    const fotoUrl = typeof payload.foto_url === "string" ? payload.foto_url : null;

    if (!cvUrl || !ijazahUrl || !fotoUrl) {
      return NextResponse.json({ error: "CV, Ijazah, dan Foto wajib diunggah" }, { status: 400 });
    }

    const registrationCode = generateRegistrationCode(lowongan.code.toUpperCase().slice(0, 3));

    const experiences = Array.isArray(form.experiences)
      ? form.experiences.filter((e) => e.companyName && e.position)
      : [];

    const created = await prisma.applications.create({
      data: {
        registration_code: registrationCode,
        lowongan_id: form.lowonganId,
        stage_id: firstStage.id,
        periode: form.periode,
        full_name: form.fullName,
        nik: form.nik,
        kk_number: form.kkNumber,
        mother_name: form.motherName,
        phone1: form.phone1,
        phone2: form.phone2 || null,
        birth_place: form.birthPlace,
        birth_date: new Date(form.birthDate),
        gender: form.gender,
        info_source: form.infoSource,
        disability: form.disability,
        worked_yazaki: form.workedYazaki === "Ya",
        marital_status: form.maritalStatus,
        email: form.email,
        religion: form.religion,
        education: form.education,
        major: form.major,
        school_name: form.schoolName,
        gpa: form.gpa,
        province: form.province,
        regency: form.regency,
        district: form.district,
        village: form.village,
        postal_code: form.postalCode,
        address: form.address,
        cv_url: cvUrl,
        cv_public_id: typeof payload.cv_public_id === "string" ? payload.cv_public_id : null,
        ijazah_url: ijazahUrl,
        ijazah_public_id: typeof payload.ijazah_public_id === "string" ? payload.ijazah_public_id : null,
        foto_url: fotoUrl,
        foto_public_id: typeof payload.foto_public_id === "string" ? payload.foto_public_id : null,
        experiences: {
          create: experiences.map((e) => ({
            company_name: e.companyName,
            position: e.position,
            year_range: e.yearRange || null,
            description: e.description || null,
          })),
        },
      },
      include: { stage: true, lowongan: true },
    });

    return NextResponse.json(
      { data: { id: created.id, registration_code: created.registration_code, stage: created.stage } },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal submit lamaran";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

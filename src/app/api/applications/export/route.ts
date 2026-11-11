import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorized } from "@/lib/auth";

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
            ],
          }
        : {}),
      ...(stageId ? { stage_id: stageId } : {}),
      ...(lowonganId ? { lowongan_id: lowonganId } : {}),
      ...(period ? { periode: period } : {}),
    };

    const applications = await prisma.applications.findMany({
      where,
      include: { lowongan: true, stage: true, scores: true },
      orderBy: { created_at: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "test_sami HRD";
    const sheet = workbook.addWorksheet("Pelamar");

    sheet.addRow([
      "No",
      "Kode Pelamar",
      "Nama",
      "No KTP",
      "Email",
      "Telpon 1",
      "Lowongan",
      "Penempatan",
      "Periode",
      "Progres",
      "Nilai Akhir",
      "Pendidikan",
      "Sekolah",
      "IPK",
      "Provinsi",
      "Kabupaten/Kota",
      "Alamat",
      "CV",
      "Ijazah",
      "Foto",
      "Tanggal Daftar",
    ]);

    applications.forEach((a, i) => {
      const scores = a.scores.map((s) => Number(s.score));
      const avg = scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : "";
      sheet.addRow([
        i + 1,
        a.registration_code,
        a.full_name,
        a.nik,
        a.email,
        a.phone1,
        a.lowongan.title,
        a.lowongan.placement,
        a.periode,
        a.stage.name,
        avg,
        a.education,
        a.school_name,
        a.gpa,
        a.province,
        a.regency,
        a.address,
        a.cv_url || "",
        a.ijazah_url || "",
        a.foto_url || "",
        a.created_at ? new Date(a.created_at).toLocaleDateString("id-ID") : "",
      ]);
    });

    sheet.columns.forEach((col) => {
      col.width = 18;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const name = lowonganId ? `pelamar-${stamp}.xlsx` : `pelamar-semua-${stamp}.xlsx`;

    return new NextResponse(buffer as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${name}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Gagal export Excel" }, { status: 500 });
  }
}

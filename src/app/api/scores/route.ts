import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

const scoreSchema = z.object({
  application_id: z.string().uuid(),
  stage_id: z.string().uuid(),
  score: z.number().min(0).max(100),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  if (!(await requireAdmin())) return unauthorized();
  try {
    const url = new URL(request.url);
    const applicationId = url.searchParams.get("application_id");
    if (!applicationId) return NextResponse.json({ error: "application_id wajib" }, { status: 400 });

    const data = await prisma.application_scores.findMany({
      where: { application_id: applicationId },
      include: { stage: true },
    });
    const scores = data.map((s) => Number(s.score));
    const final_score = scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : null;
    return NextResponse.json({ data, meta: { final_score } });
  } catch {
    return NextResponse.json({ error: "Gagal memuat nilai" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    const body = await request.json();
    const parsed = scoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Validasi gagal" }, { status: 400 });
    }
    const { application_id, stage_id, score, notes } = parsed.data;

    const data = await prisma.application_scores.upsert({
      where: { application_id_stage_id: { application_id, stage_id } },
      update: { score, notes: notes || null, created_by: session.adminId },
      create: { application_id, stage_id, score, notes: notes || null, created_by: session.adminId },
      include: { stage: true },
    });

    const all = await prisma.application_scores.findMany({ where: { application_id } });
    const scores = all.map((s) => Number(s.score));
    const final_score = scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : null;

    return NextResponse.json({ data, meta: { final_score } });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan nilai" }, { status: 500 });
  }
}

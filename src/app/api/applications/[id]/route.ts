import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

const patchSchema = z.object({
  stage_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export async function GET(_request: Request, { params }: Params) {
  if (!(await requireAdmin())) return unauthorized();
  try {
    const app = await prisma.applications.findUnique({
      where: { id: params.id },
      include: {
        lowongan: true,
        stage: true,
        experiences: true,
        scores: { include: { stage: true } },
        logs: {
          include: { from_stage: true, to_stage: true, admin: true },
          orderBy: { created_at: "desc" },
        },
      },
    });
    if (!app) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

    const scores = app.scores.map((s) => Number(s.score));
    const final_score = scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : null;

    return NextResponse.json({ data: { ...app, final_score } });
  } catch {
    return NextResponse.json({ error: "Gagal memuat pelamar" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return unauthorized();
  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Validasi gagal" }, { status: 400 });
    }

    const existing = await prisma.applications.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

    const data: { stage_id?: string; notes?: string } = {};
    if (parsed.data.stage_id) data.stage_id = parsed.data.stage_id;
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;

    if (parsed.data.stage_id && parsed.data.stage_id !== existing.stage_id) {
      await prisma.application_logs.create({
        data: {
          application_id: existing.id,
          from_stage_id: existing.stage_id,
          to_stage_id: parsed.data.stage_id,
          changed_by: session.adminId,
        },
      });
    }

    const updated = await prisma.applications.update({
      where: { id: params.id },
      data,
      include: { stage: true, lowongan: true },
    });

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Gagal mengubah pelamar" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await requireAdmin())) return unauthorized();
  try {
    await prisma.applications.delete({ where: { id: params.id } });
    return NextResponse.json({ data: { ok: true } });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus pelamar" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(255).optional(),
  placement: z.string().min(1).max(255).optional(),
  qualification: z.string().min(1).optional(),
  period: z.string().min(1).max(20).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const data = await prisma.lowongan.findUnique({ where: { id: params.id } });
    if (!data) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Gagal memuat lowongan" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  if (!(await requireAdmin())) return unauthorized();
  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Validasi gagal" }, { status: 400 });
    }
    const data = await prisma.lowongan.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Gagal mengubah lowongan" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await requireAdmin())) return unauthorized();
  try {
    const apps = await prisma.applications.count({ where: { lowongan_id: params.id } });
    if (apps > 0) {
      return NextResponse.json({ error: "Lowongan masih memiliki pelamar" }, { status: 400 });
    }
    await prisma.lowongan.delete({ where: { id: params.id } });
    return NextResponse.json({ data: { ok: true } });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus lowongan" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  try {
    const data = await prisma.application_stages.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Gagal memuat tahap" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return unauthorized();
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Nama tahap wajib diisi" }, { status: 400 });

    const max = await prisma.application_stages.aggregate({ _max: { order: true } });
    const data = await prisma.application_stages.create({
      data: {
        name,
        order: (max._max.order ?? 0) + 1,
        is_terminal: Boolean(body.is_terminal),
      },
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menambah tahap" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) return unauthorized();
  try {
    const body = await request.json();

    // Bulk reorder: [{ id, order }, ...]
    if (Array.isArray(body.items)) {
      for (const item of body.items) {
        if (!item?.id || typeof item.order !== "number") continue;
        await prisma.application_stages.update({
          where: { id: item.id },
          data: { order: item.order },
        });
      }
      const data = await prisma.application_stages.findMany({ orderBy: { order: "asc" } });
      return NextResponse.json({ data });
    }

    // Single update
    if (!body.id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });
    const data = await prisma.application_stages.update({
      where: { id: body.id },
      data: {
        ...(typeof body.name === "string" ? { name: body.name.trim() } : {}),
        ...(typeof body.order === "number" ? { order: body.order } : {}),
        ...(typeof body.is_terminal === "boolean" ? { is_terminal: body.is_terminal } : {}),
      },
    });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Gagal mengubah tahap" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) return unauthorized();
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });

    const used = await prisma.applications.count({ where: { stage_id: id } });
    if (used > 0) {
      return NextResponse.json({ error: "Tahap masih dipakai pelamar" }, { status: 400 });
    }

    const total = await prisma.application_stages.count();
    if (total <= 1) {
      return NextResponse.json({ error: "Minimal harus ada satu tahap" }, { status: 400 });
    }

    await prisma.application_stages.delete({ where: { id } });
    return NextResponse.json({ data: { ok: true } });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus tahap" }, { status: 500 });
  }
}

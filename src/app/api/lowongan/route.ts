import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  code: z.string().min(1).max(50),
  title: z.string().min(1).max(255),
  placement: z.string().min(1).max(255),
  qualification: z.string().min(1),
  period: z.string().min(1).max(20),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get("active") === "1";
    const data = await prisma.lowongan.findMany({
      where: activeOnly ? { is_active: true } : undefined,
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Gagal memuat lowongan" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return unauthorized();
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Validasi gagal" }, { status: 400 });
    }
    const data = await prisma.lowongan.create({ data: parsed.data });
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal membuat lowongan" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const data = await prisma.lowongan.findMany({
      where: { is_active: true, ...(code ? { code } : {}) },
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Gagal memuat lowongan" }, { status: 500 });
  }
}

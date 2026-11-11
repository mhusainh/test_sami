import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) return null;
  return session;
}

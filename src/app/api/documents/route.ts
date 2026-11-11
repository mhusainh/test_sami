import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

function extractPublicId(url: string): { publicId: string; resourceType: "raw" | "image" } | null {
  const isRaw = url.includes("/raw/upload");
  const match = url.match(/(?:raw|image)\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?(?:\?.*)?$/);
  if (!match || !match[1]) return null;
  let publicId = match[1];
  // strip query if any leaked
  publicId = publicId.split("?")[0];
  if (!publicId) return null;
  return { publicId, resourceType: isRaw ? "raw" : "image" };
}

function contentTypeFor(url: string): string {
  const lower = url.toLowerCase().split("?")[0];
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.includes("/raw/upload")) return "application/pdf";
  return "application/octet-stream";
}

function dispositionFor(url: string, contentType: string): string {
  const lower = url.toLowerCase().split("?")[0];
  let name = lower.split("/").pop() || "dokumen";
  if (!/\.[a-z0-9]+$/i.test(name)) {
    if (contentType === "application/pdf") name += ".pdf";
    else if (contentType === "image/jpeg") name += ".jpg";
    else if (contentType === "image/png") name += ".png";
  }
  const inline =
    contentType === "application/pdf" ||
    contentType.startsWith("image/");
  const type = inline ? "inline" : "attachment";
  return `${type}; filename="${encodeURIComponent(name)}"`;
}

/**
 * Proxy dokumen Cloudinary (CV/Ijazah/Foto) — pola sama dengan Portfolio /api/resume:
 * stream bersih + fallback signed URL bila fetch langsung ditolak.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const target = url.searchParams.get("url");
    if (!target) {
      return new NextResponse("url wajib diisi", { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      return new NextResponse("url tidak valid", { status: 400 });
    }

    if (!parsed.hostname.endsWith("cloudinary.com")) {
      return new NextResponse("hanya url cloudinary yang diizinkan", { status: 400 });
    }

    const extracted = extractPublicId(parsed.toString());
    if (!extracted) {
      return new NextResponse("gagal membaca public_id cloudinary", { status: 400 });
    }

    const contentType = contentTypeFor(parsed.toString());

    // 1) Fetch langsung
    const response = await fetch(parsed.toString());
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": dispositionFor(parsed.toString(), contentType),
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // 2) Fallback signed URL
    const signedUrl = cloudinary.utils.url(extracted.publicId, {
      resource_type: extracted.resourceType,
      sign_url: true,
      secure: true,
    });

    const signedRes = await fetch(signedUrl);
    if (signedRes.ok) {
      const buffer = await signedRes.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": dispositionFor(parsed.toString(), contentType),
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // 3) Terakhir: redirect ke signed URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memuat dokumen";
    return new NextResponse(message, { status: 500 });
  }
}

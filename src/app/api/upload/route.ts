import { NextResponse } from "next/server";
import cloudinary, { FOLDERS, UploadModule } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

const ALLOWED: Record<UploadModule, { mimes: string[]; maxBytes: number }> = {
  cv: { mimes: ["application/pdf"], maxBytes: 5 * 1024 * 1024 },
  ijazah: {
    mimes: ["application/pdf", "image/jpeg", "image/png", "image/jpg"],
    maxBytes: 5 * 1024 * 1024,
  },
  foto: { mimes: ["image/jpeg", "image/png", "image/jpg"], maxBytes: 2 * 1024 * 1024 },
  lowongan: { mimes: ["image/jpeg", "image/png", "image/jpg", "image/webp"], maxBytes: 5 * 1024 * 1024 },
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const moduleType = (formData.get("module") as UploadModule) || "cv";

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    const rule = ALLOWED[moduleType];
    if (!rule) {
      return NextResponse.json({ error: "Modul upload tidak dikenal" }, { status: 400 });
    }

    if (file.size > rule.maxBytes) {
      const mb = Math.round(rule.maxBytes / (1024 * 1024));
      return NextResponse.json({ error: `Ukuran file maksimal ${mb} MB` }, { status: 400 });
    }

    if (!rule.mimes.includes(file.type) && !(moduleType !== "foto" && file.name.toLowerCase().endsWith(".pdf") && file.type === "")) {
      return NextResponse.json({ error: `Format file tidak diizinkan untuk ${moduleType}` }, { status: 400 });
    }

    const folder = FOLDERS[moduleType];
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const resourceType = isPdf ? "raw" : "image";

    const uploadResponse = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          type: "upload",
          access_mode: "public",
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error || !result) reject(error || new Error("Cloudinary upload failed"));
          else resolve({ secure_url: result.secure_url, public_id: result.public_id });
        }
      );
      stream.end(buffer);
    });

    return NextResponse.json({
      data: { url: uploadResponse.secure_url, publicId: uploadResponse.public_id, folder },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload gagal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

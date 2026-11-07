import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "Tidak ada file yang dipilih" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);

    // Optimize image with sharp to PNG with max width 800px to keep it lightweight, fast & sharp
    let optimizedBuffer: Buffer;
    try {
      optimizedBuffer = await sharp(inputBuffer)
        .resize({ width: 800, withoutEnlargement: true })
        .png({ quality: 90, compressionLevel: 8 })
        .toBuffer();
    } catch (e) {
      console.warn("Sharp optimization fallback:", e);
      optimizedBuffer = inputBuffer;
    }

    // Generate Base64 Data URL (immune to Next.js static asset caching / 404s)
    const base64Url = `data:image/png;base64,${optimizedBuffer.toString("base64")}`;

    // Also persist to public/uploads directory
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.png`;
      await writeFile(path.join(uploadsDir, filename), optimizedBuffer);
    } catch (fsErr) {
      console.warn("Could not write to disk uploads (ignorable):", fsErr);
    }

    return NextResponse.json({
      url: base64Url,
      success: true,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Gagal memproses upload: " + String(error) },
      { status: 500 }
    );
  }
}

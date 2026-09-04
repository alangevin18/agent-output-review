import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

const SEED_ROOT = path.join(process.cwd(), "data/seed");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathParts } = await params;
  const filePath = path.join(SEED_ROOT, ...pathParts);

  // Security: ensure path is within SEED_ROOT
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(SEED_ROOT)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) {
      return NextResponse.json({ error: "Not a file" }, { status: 400 });
    }

    const ext = path.extname(filePath).toLowerCase();
    
    // For images, return the binary data with appropriate content type
    if ([".png", ".jpg"].includes(ext)) {
      const buffer = await readFile(filePath);
      const contentType = ext === ".png" ? "image/png" : "image/jpeg";
      
      return new NextResponse(buffer, {
        headers: { "Content-Type": contentType },
      });
    }

    // For text files, return JSON with content and metadata
    const content = await readFile(filePath, "utf-8");
    
    return NextResponse.json({
      content,
      size: stats.size,
      filename: path.basename(filePath),
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";

const PROJECT_FILES_DIR = path.join(
  process.cwd(),
  "data/seed/project-files"
);

export type FileEntry = {
  name: string;
  path: string;
  type: "file" | "folder";
  fileType?: string;
  lastModified: string;
  children?: FileEntry[];
};

function getFileType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".json":
      return "JSON";
    case ".csv":
      return "CSV";
    case ".md":
      return "Markdown";
    case ".png":
    case ".jpg":
    case ".jpeg":
      return "Image";
    case ".txt":
      return "Text";
    default:
      return "File";
  }
}

async function scanDirectory(dirPath: string, basePath: string = ""): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  
  try {
    const items = await readdir(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativePath = basePath ? `${basePath}/${item}` : item;
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        const children = await scanDirectory(fullPath, relativePath);
        entries.push({
          name: item,
          path: relativePath,
          type: "folder",
          lastModified: stats.mtime.toISOString(),
          children,
        });
      } else {
        entries.push({
          name: item,
          path: relativePath,
          type: "file",
          fileType: getFileType(item),
          lastModified: stats.mtime.toISOString(),
        });
      }
    }
  } catch (error) {
    console.error("Error scanning directory:", error);
  }
  
  // Sort: folders first, then files, alphabetically
  entries.sort((a, b) => {
    if (a.type === "folder" && b.type === "file") return -1;
    if (a.type === "file" && b.type === "folder") return 1;
    return a.name.localeCompare(b.name);
  });
  
  return entries;
}

export async function GET() {
  const files = await scanDirectory(PROJECT_FILES_DIR);
  return NextResponse.json(files);
}

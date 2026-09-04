"use client";

import { useState } from "react";
import Link from "next/link";
import { Folder, FileText, ChevronRight } from "lucide-react";
import type { FileEntry } from "@/app/api/drive/route";
import { useDrive } from "@/lib/drive-context";

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function FileIcon({ type }: { type?: string }) {
  return <FileText className="size-4 text-muted-foreground" />;
}

function FolderRow({ entry, depth = 0 }: { entry: FileEntry; depth?: number }) {
  const [expanded, setExpanded] = useState(true);

  if (entry.type === "file") {
    return (
      <tr className="border-b border-black/10 hover:bg-muted/50">
        <td className="py-2 pr-4">
          <Link
            href={`/drive/${entry.path}`}
            className="flex items-center gap-2 hover:underline"
            style={{ paddingLeft: `${depth * 20}px` }}
          >
            <FileIcon type={entry.fileType} />
            <span className="font-mono text-sm">{entry.name}</span>
          </Link>
        </td>
        <td className="py-2 pr-4 text-sm text-muted-foreground">
          {entry.fileType}
        </td>
        <td className="py-2 text-sm text-muted-foreground">
          {formatDate(entry.lastModified)}
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr
        className="border-b border-black/10 hover:bg-muted/50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-2 pr-4">
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${depth * 20}px` }}
          >
            <ChevronRight
              className={`size-3.5 text-muted-foreground transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
            />
            <Folder className="size-4 text-muted-foreground" />
            <span className="font-mono text-sm">{entry.name}/</span>
          </div>
        </td>
        <td className="py-2 pr-4 text-sm text-muted-foreground">Folder</td>
        <td className="py-2 text-sm text-muted-foreground">
          {formatDate(entry.lastModified)}
        </td>
      </tr>
      {expanded &&
        entry.children?.map((child) => (
          <FolderRow key={child.path} entry={child} depth={depth + 1} />
        ))}
    </>
  );
}

export default function DrivePage() {
  const { files, loading } = useDrive();

  return (
    <div className="w-full px-6 py-6">
      <h1 className="text-lg font-display font-normal">Project Files</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Trusted files currently in this project
      </p>

      {loading ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Loading...
        </p>
      ) : files.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          No files yet
        </p>
      ) : (
        <table className="mt-6 w-full">
          <thead>
            <tr className="border-b border-black text-left text-sm text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">Name</th>
              <th className="pb-2 pr-4 font-medium">Type</th>
              <th className="pb-2 font-medium">Last updated</th>
            </tr>
          </thead>
          <tbody>
            {files.map((entry) => (
              <FolderRow key={entry.path} entry={entry} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

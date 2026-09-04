"use client";

import { useState, use } from "react";
import Link from "next/link";
import { ChevronRight, FileText, Folder } from "lucide-react";
import type { FileEntry } from "@/app/api/drive/route";
import { ImagePreview } from "@/components/reviews/previews/image-preview";
import { JSONPreview } from "@/components/reviews/previews/json-preview";
import { CSVPreview } from "@/components/reviews/previews/csv-preview";
import { MarkdownPreview } from "@/components/reviews/previews/markdown-preview";
import { useDrive } from "@/lib/drive-context";
import type { FileAction } from "@/types";

function FileTreeItem({
  entry,
  depth = 0,
  currentPath,
}: {
  entry: FileEntry;
  depth?: number;
  currentPath: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const isActive = entry.path === currentPath;

  if (entry.type === "file") {
    return (
      <Link
        href={`/drive/${entry.path}`}
        className={`flex items-center gap-1.5 rounded px-2 py-1 text-sm hover:bg-muted ${
          isActive ? "bg-primary/30 font-medium" : ""
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{entry.name}</span>
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm hover:bg-muted"
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <ChevronRight
          className={`size-3 shrink-0 text-muted-foreground transition-transform ${
            expanded ? "rotate-90" : ""
          }`}
        />
        <Folder className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{entry.name}</span>
      </button>
      {expanded &&
        entry.children?.map((child) => (
          <FileTreeItem
            key={child.path}
            entry={child}
            depth={depth + 1}
            currentPath={currentPath}
          />
        ))}
    </div>
  );
}

export default function DriveFilePage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const resolvedParams = use(params);
  const filePath = resolvedParams.path.join("/");
  const { files } = useDrive();

  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
  const filename = filePath.split("/").pop() || "";

  // For Drive files, we use "created" action since they're existing files (no comparison)
  const action: FileAction = "created";
  const seedPath = `project-files/${filePath}`;

  const renderPreview = () => {
    if (isImage) {
      return <ImagePreview seedPath={seedPath} filename={filename} action={action} showHeader={false} />;
    }

    switch (ext) {
      case "json":
        return <JSONPreview seedPath={seedPath} filename={filename} action={action} showHeader={false} />;
      case "csv":
        return <CSVPreview seedPath={seedPath} filename={filename} action={action} showHeader={false} />;
      case "md":
        return <MarkdownPreview seedPath={seedPath} filename={filename} action={action} showHeader={false} />;
      default:
        return <JSONPreview seedPath={seedPath} filename={filename} action={action} showHeader={false} />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-6">
          <h1 className="text-lg font-display font-normal">{filename}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filePath}</p>
          <div className="mt-4 rounded-lg border border-black/20 bg-white overflow-hidden">
            {renderPreview()}
          </div>
        </div>
      </div>

      {/* Right panel - file tree */}
      <aside className="w-[280px] shrink-0 border-l border-black bg-sidebar overflow-auto">
        <div className="px-3 py-3">
          <h2 className="text-sm font-medium text-muted-foreground">Files</h2>
        </div>
        <div className="px-1 pb-4">
          {files.map((entry) => (
            <FileTreeItem
              key={entry.path}
              entry={entry}
              currentPath={filePath}
            />
          ))}
        </div>
      </aside>
    </div>
  );
}

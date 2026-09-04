"use client";

import type { FileAction, SubmissionFile } from "@/types";
import { ImagePreview } from "./image-preview";
import { CSVPreview } from "./csv-preview";
import { JSONPreview } from "./json-preview";
import { MarkdownPreview } from "./markdown-preview";
import { FileX } from "lucide-react";

function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

export function ActionPill({ action }: { action: FileAction }) {
  const label = action.charAt(0).toUpperCase() + action.slice(1);
  return (
    <span className="shrink-0 rounded-full border border-black/20 bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
      {label}
    </span>
  );
}

function DeletedFilePreview({ filename }: { filename: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-black/10 bg-sidebar px-4 py-2">
        <div>
          <p className="text-sm font-medium">{filename}</p>
        </div>
        <ActionPill action="deleted" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6">
        <FileX className="size-12 text-red-300" />
        <p className="text-sm text-muted-foreground">
          This file will be deleted
        </p>
      </div>
    </div>
  );
}

export function FilePreview({ file }: { file: SubmissionFile }) {
  const { filename, seedPath, action } = file;
  const extension = getFileExtension(filename);

  // Handle deleted files
  if (action === "deleted" || !seedPath) {
    return <DeletedFilePreview filename={filename} />;
  }

  // Route to appropriate preview based on extension
  switch (extension) {
    case "png":
    case "jpg":
      return <ImagePreview seedPath={seedPath} filename={filename} action={action} />;

    case "csv":
      return <CSVPreview seedPath={seedPath} filename={filename} action={action} />;

    case "json":
      return <JSONPreview seedPath={seedPath} filename={filename} action={action} />;

    case "md":
      return <MarkdownPreview seedPath={seedPath} filename={filename} action={action} />;

    default:
      // Should not happen with valid data
      return <DeletedFilePreview filename={filename} />;
  }
}

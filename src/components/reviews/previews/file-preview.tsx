"use client";

import type { FileAction, SubmissionFile } from "@/types";
import { ImagePreview } from "./image-preview";
import { ImageComparePreview } from "./image-compare-preview";
import { CSVPreview } from "./csv-preview";
import { CSVComparePreview } from "./csv-compare-preview";
import { JSONPreview } from "./json-preview";
import { JSONComparePreview } from "./json-compare-preview";
import { MarkdownPreview } from "./markdown-preview";
import { MarkdownComparePreview } from "./markdown-compare-preview";
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

function DeletionWarningBanner() {
  return (
    <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2">
      <p className="text-sm text-red-700">
        <strong>Warning:</strong> This file will be removed from Project Files if approved.
      </p>
    </div>
  );
}

function DeletedFilePreview({
  filename,
  targetPath,
}: {
  filename: string;
  targetPath: string;
}) {
  const extension = getFileExtension(filename);
  const currentPath = `project-files/${targetPath}`;

  return (
    <div className="flex h-full flex-col">
      <DeletionWarningBanner />

      {/* Show current file content based on type */}
      <div className="min-h-0 flex-1">
        {(extension === "png" || extension === "jpg") && (
          <ImagePreview seedPath={currentPath} filename={filename} action="deleted" />
        )}
        {extension === "csv" && (
          <CSVPreview seedPath={currentPath} filename={filename} action="deleted" />
        )}
        {extension === "json" && (
          <JSONPreview seedPath={currentPath} filename={filename} action="deleted" />
        )}
        {extension === "md" && (
          <MarkdownPreview seedPath={currentPath} filename={filename} action="deleted" />
        )}
        {!["png", "jpg", "csv", "json", "md"].includes(extension) && (
          <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-black/10 bg-sidebar px-4 py-2">
              <div>
                <p className="text-sm font-medium">{filename}</p>
                <p className="text-xs text-muted-foreground">{targetPath}</p>
              </div>
              <ActionPill action="deleted" />
            </div>
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6">
              <FileX className="size-12 text-red-300" />
              <p className="text-sm text-muted-foreground">
                Preview not available for this file type
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function FilePreview({ file }: { file: SubmissionFile }) {
  const { filename, seedPath, targetPath, action } = file;
  const extension = getFileExtension(filename);

  // Handle deleted files
  if (action === "deleted" || !seedPath) {
    return <DeletedFilePreview filename={filename} targetPath={targetPath} />;
  }

  // For updated files, use comparison views
  if (action === "updated") {
    switch (extension) {
      case "png":
      case "jpg":
        return (
          <ImageComparePreview
            proposedPath={seedPath}
            currentPath={targetPath}
            filename={filename}
            action={action}
          />
        );

      case "csv":
        return (
          <CSVComparePreview
            proposedPath={seedPath}
            currentPath={targetPath}
            filename={filename}
            action={action}
          />
        );

      case "json":
        return (
          <JSONComparePreview
            proposedPath={seedPath}
            currentPath={targetPath}
            filename={filename}
            action={action}
          />
        );

      case "md":
        return (
          <MarkdownComparePreview
            proposedPath={seedPath}
            currentPath={targetPath}
            filename={filename}
            action={action}
          />
        );
    }
  }

  // For created files, use single-file preview
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
      // Unsupported file type - show basic info
      return (
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-black/10 bg-sidebar px-4 py-2">
            <div>
              <p className="text-sm font-medium">{filename}</p>
              <p className="text-xs text-muted-foreground">{seedPath}</p>
            </div>
            <ActionPill action={action} />
          </div>
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6">
            <FileX className="size-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Preview not available for this file type
            </p>
          </div>
        </div>
      );
  }
}

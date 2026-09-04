"use client";

import type { FileAction, SubmissionFile } from "@/types";
import type { ConflictStatus } from "@/app/api/files/conflict/route";
import { ImagePreview } from "./image-preview";
import { ImageComparePreview } from "./image-compare-preview";
import { CSVPreview } from "./csv-preview";
import { CSVComparePreview } from "./csv-compare-preview";
import { JSONPreview } from "./json-preview";
import { JSONComparePreview } from "./json-compare-preview";
import { MarkdownPreview } from "./markdown-preview";
import { MarkdownComparePreview } from "./markdown-compare-preview";
import { AlertTriangle, FileX, Info } from "lucide-react";

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

function ConflictBanner({ conflict }: { conflict: ConflictStatus }) {
  if (!conflict.hasConflict) return null;

  if (conflict.type === "deleted") {
    return (
      <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            <strong>Conflict:</strong> {conflict.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-b border-blue-200 bg-blue-50 px-4 py-2">
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 size-4 shrink-0 text-blue-600" />
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> {conflict.message}
        </p>
      </div>
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

export function FilePreview({ 
  file,
  conflict,
  effectiveAction,
}: { 
  file: SubmissionFile;
  conflict?: ConflictStatus | null;
  effectiveAction?: FileAction;
}) {
  const { filename, seedPath, targetPath, action } = file;
  const extension = getFileExtension(filename);

  // Use effectiveAction if provided (e.g., "created" -> "updated" when file already exists,
  // or "updated" -> "created" when target was deleted)
  const displayAction = effectiveAction || action;

  // Handle deleted files (action is delete) — show current project file if it still exists
  if (action === "deleted" || !seedPath) {
    if (conflict?.type === "deleted") {
      // Target already gone — auto-approved, nothing to decide
      return (
        <div className="flex h-full flex-col">
          <ConflictBanner conflict={conflict} />
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6">
            <FileX className="size-12 text-muted-foreground/30" />
            <p className="text-sm font-medium">Already deleted</p>
            <p className="max-w-md text-center text-sm text-muted-foreground">
              This deletion was auto-approved because the file is already gone from Project Files.
            </p>
          </div>
        </div>
      );
    }
    return <DeletedFilePreview filename={filename} targetPath={targetPath} />;
  }

  // Wrap content with conflict banner if needed
  const wrapWithBanner = (content: React.ReactNode) => {
    if (conflict?.hasConflict) {
      return (
        <div className="flex h-full flex-col">
          <ConflictBanner conflict={conflict} />
          <div className="min-h-0 flex-1">{content}</div>
        </div>
      );
    }
    return content;
  };

  // For updated files (or created files that already exist), use comparison views
  if (displayAction === "updated") {
    switch (extension) {
      case "png":
      case "jpg":
        return wrapWithBanner(
          <ImageComparePreview
            proposedPath={seedPath}
            currentPath={targetPath}
            filename={filename}
            action={action}
          />
        );

      case "csv":
        return wrapWithBanner(
          <CSVComparePreview
            proposedPath={seedPath}
            currentPath={targetPath}
            filename={filename}
            action={action}
          />
        );

      case "json":
        return wrapWithBanner(
          <JSONComparePreview
            proposedPath={seedPath}
            currentPath={targetPath}
            filename={filename}
            action={action}
          />
        );

      case "md":
        return wrapWithBanner(
          <MarkdownComparePreview
            proposedPath={seedPath}
            currentPath={targetPath}
            filename={filename}
            action={action}
          />
        );
    }
  }

  // For created files (including updated→deleted remapped to create), use single-file preview
  switch (extension) {
    case "png":
    case "jpg":
      return wrapWithBanner(
        <ImagePreview seedPath={seedPath} filename={filename} action={displayAction} />
      );

    case "csv":
      return wrapWithBanner(
        <CSVPreview seedPath={seedPath} filename={filename} action={displayAction} />
      );

    case "json":
      return wrapWithBanner(
        <JSONPreview seedPath={seedPath} filename={filename} action={displayAction} />
      );

    case "md":
      return wrapWithBanner(
        <MarkdownPreview seedPath={seedPath} filename={filename} action={displayAction} />
      );

    default:
      // Unsupported file type - show basic info
      return wrapWithBanner(
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-black/10 bg-sidebar px-4 py-2">
            <div>
              <p className="text-sm font-medium">{filename}</p>
              <p className="text-xs text-muted-foreground">{seedPath}</p>
            </div>
            <ActionPill action={displayAction} />
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

"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { FileAction } from "@/types";
import { ActionPill } from "./file-preview";

export function ImagePreview({
  seedPath,
  filename,
  action,
}: {
  seedPath: string;
  filename: string;
  action: FileAction;
}) {
  const [zoom, setZoom] = useState(1);
  const src = `/api/files/${seedPath}`;

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));
  const handleReset = () => setZoom(1);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-black/10 bg-sidebar px-4 py-2">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium">{filename}</p>
            <p className="text-xs text-muted-foreground">{seedPath}</p>
          </div>
          <ActionPill action={action} />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="rounded p-1.5 hover:bg-primary/30"
            title="Zoom out"
          >
            <ZoomOut className="size-4" />
          </button>
          <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="rounded p-1.5 hover:bg-primary/30"
            title="Zoom in"
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            onClick={handleReset}
            className="rounded p-1.5 hover:bg-primary/30"
            title="Reset zoom"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div className="min-h-0 flex-1 overflow-auto bg-black/5 p-4">
        <div className="flex min-h-full items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={filename}
            className="max-w-full object-contain transition-transform"
            style={{ transform: `scale(${zoom})` }}
          />
        </div>
      </div>
    </div>
  );
}

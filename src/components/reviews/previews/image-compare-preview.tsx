"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { FileAction } from "@/types";
import { ActionPill } from "./file-preview";

type ViewMode = "compare" | "current" | "proposed";

type ScrollPosition = {
  left: number;
  top: number;
  viewWidth: number;
  viewHeight: number;
  scrollWidth: number;
  scrollHeight: number;
};

function MiniMap({
  src,
  scrollPos,
  onNavigate,
}: {
  src: string;
  scrollPos: ScrollPosition;
  onNavigate: (percentX: number, percentY: number) => void;
}) {
  const miniMapRef = useRef<HTMLDivElement>(null);

  const { left, top, viewWidth, viewHeight, scrollWidth, scrollHeight } = scrollPos;

  if (scrollWidth <= viewWidth && scrollHeight <= viewHeight) return null;

  const boxLeft = scrollWidth > 0 ? (left / scrollWidth) * 100 : 0;
  const boxTop = scrollHeight > 0 ? (top / scrollHeight) * 100 : 0;
  const boxWidth = scrollWidth > 0 ? (viewWidth / scrollWidth) * 100 : 100;
  const boxHeight = scrollHeight > 0 ? (viewHeight / scrollHeight) * 100 : 100;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!miniMapRef.current) return;
    const rect = miniMapRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;
    onNavigate(clickX, clickY);
  };

  return (
    <div
      ref={miniMapRef}
      onClick={handleClick}
      className="absolute bottom-4 right-4 z-10 h-24 w-32 cursor-pointer overflow-hidden rounded border border-black/30 bg-white/95 shadow-lg"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Navigator" className="h-full w-full object-contain" />
      <div
        className="absolute border-2 border-blue-500 bg-blue-500/20"
        style={{
          left: `${boxLeft}%`,
          top: `${boxTop}%`,
          width: `${Math.min(boxWidth, 100 - boxLeft)}%`,
          height: `${Math.min(boxHeight, 100 - boxTop)}%`,
        }}
      />
    </div>
  );
}

export function ImageComparePreview({
  proposedPath,
  currentPath,
  filename,
  action,
}: {
  proposedPath: string;
  currentPath: string;
  filename: string;
  action: FileAction;
}) {
  const [mode, setMode] = useState<ViewMode>("compare");
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollX: 0, scrollY: 0 });
  const [scrollPos, setScrollPos] = useState<ScrollPosition>({
    left: 0,
    top: 0,
    viewWidth: 0,
    viewHeight: 0,
    scrollWidth: 0,
    scrollHeight: 0,
  });

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const singleScrollRef = useRef<HTMLDivElement>(null);
  const pendingCenterRef = useRef<{ x: number; y: number } | null>(null);

  const proposedSrc = `/api/files/${proposedPath}`;
  const currentSrc = `/api/files/project-files/${currentPath}`;

  const getActiveContainer = useCallback(() => {
    return mode === "compare" ? leftScrollRef.current : singleScrollRef.current;
  }, [mode]);

  const updateScrollPos = useCallback(() => {
    const container = getActiveContainer();
    if (!container) return;
    setScrollPos({
      left: container.scrollLeft,
      top: container.scrollTop,
      viewWidth: container.clientWidth,
      viewHeight: container.clientHeight,
      scrollWidth: container.scrollWidth,
      scrollHeight: container.scrollHeight,
    });
  }, [getActiveContainer]);

  // Sync scroll between panels in compare mode
  const syncScroll = useCallback((source: "left" | "right") => {
    const sourceRef = source === "left" ? leftScrollRef : rightScrollRef;
    const targetRef = source === "left" ? rightScrollRef : leftScrollRef;

    if (sourceRef.current && targetRef.current) {
      targetRef.current.scrollTop = sourceRef.current.scrollTop;
      targetRef.current.scrollLeft = sourceRef.current.scrollLeft;
    }
    updateScrollPos();
  }, [updateScrollPos]);

  // After zoom changes, restore center
  useEffect(() => {
    const container = getActiveContainer();
    if (!container || !pendingCenterRef.current) return;

    const { x: centerX, y: centerY } = pendingCenterRef.current;
    pendingCenterRef.current = null;

    const newScrollLeft = centerX * container.scrollWidth - container.clientWidth / 2;
    const newScrollTop = centerY * container.scrollHeight - container.clientHeight / 2;

    container.scrollLeft = Math.max(0, newScrollLeft);
    container.scrollTop = Math.max(0, newScrollTop);

    // Sync in compare mode
    if (mode === "compare" && rightScrollRef.current) {
      rightScrollRef.current.scrollLeft = Math.max(0, newScrollLeft);
      rightScrollRef.current.scrollTop = Math.max(0, newScrollTop);
    }

    updateScrollPos();
  }, [zoom, mode, getActiveContainer, updateScrollPos]);

  useEffect(() => {
    updateScrollPos();
  }, [updateScrollPos]);

  const handleZoom = (newZoom: number) => {
    const container = getActiveContainer();
    if (container && container.scrollWidth > 0 && container.scrollHeight > 0) {
      const centerX = (container.scrollLeft + container.clientWidth / 2) / container.scrollWidth;
      const centerY = (container.scrollTop + container.clientHeight / 2) / container.scrollHeight;
      pendingCenterRef.current = { x: centerX, y: centerY };
    }
    setZoom(newZoom);
  };

  const handleZoomIn = () => handleZoom(Math.min(zoom + 0.25, 3));
  const handleZoomOut = () => handleZoom(Math.max(zoom - 0.25, 0.25));
  const handleReset = () => {
    pendingCenterRef.current = null;
    setZoom(1);
  };

  const handleNavigate = (percentX: number, percentY: number) => {
    const container = getActiveContainer();
    if (!container) return;

    const targetX = percentX * container.scrollWidth - container.clientWidth / 2;
    const targetY = percentY * container.scrollHeight - container.clientHeight / 2;

    container.scrollTo({
      left: Math.max(0, targetX),
      top: Math.max(0, targetY),
      behavior: "smooth",
    });

    if (mode === "compare" && rightScrollRef.current) {
      rightScrollRef.current.scrollTo({
        left: Math.max(0, targetX),
        top: Math.max(0, targetY),
        behavior: "smooth",
      });
    }
  };

  // Drag handlers for compare mode (syncs both panels)
  const handleMouseDownCompare = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      scrollX: leftScrollRef.current?.scrollLeft || 0,
      scrollY: leftScrollRef.current?.scrollTop || 0,
    });
  };

  const handleMouseMoveCompare = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const newScrollX = dragStart.scrollX - dx;
    const newScrollY = dragStart.scrollY - dy;

    if (leftScrollRef.current) {
      leftScrollRef.current.scrollLeft = newScrollX;
      leftScrollRef.current.scrollTop = newScrollY;
    }
    if (rightScrollRef.current) {
      rightScrollRef.current.scrollLeft = newScrollX;
      rightScrollRef.current.scrollTop = newScrollY;
    }
  };

  // Drag handlers for single view
  const handleMouseDownSingle = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      scrollX: singleScrollRef.current?.scrollLeft || 0,
      scrollY: singleScrollRef.current?.scrollTop || 0,
    });
  };

  const handleMouseMoveSingle = (e: React.MouseEvent) => {
    if (!isDragging || !singleScrollRef.current) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    singleScrollRef.current.scrollLeft = dragStart.scrollX - dx;
    singleScrollRef.current.scrollTop = dragStart.scrollY - dy;
  };

  const handleMouseUp = () => setIsDragging(false);

  const cursorClass = zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-black/10 bg-sidebar px-4 py-2">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium">{filename}</p>
            <p className="text-xs text-muted-foreground">{currentPath}</p>
          </div>
          <ActionPill action={action} />
        </div>
        <div className="flex items-center gap-4">
          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button onClick={handleZoomOut} className="rounded p-1.5 hover:bg-primary/30" title="Zoom out">
              <ZoomOut className="size-4" />
            </button>
            <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <button onClick={handleZoomIn} className="rounded p-1.5 hover:bg-primary/30" title="Zoom in">
              <ZoomIn className="size-4" />
            </button>
            <button onClick={handleReset} className="rounded p-1.5 hover:bg-primary/30" title="Reset zoom">
              <RotateCcw className="size-4" />
            </button>
          </div>
          {/* View mode tabs */}
          <div className="flex rounded border border-black/10 text-xs">
            <button
              onClick={() => setMode("compare")}
              className={`px-3 py-1 ${mode === "compare" ? "bg-primary/20 font-medium" : "hover:bg-primary/10"}`}
            >
              Compare
            </button>
            <button
              onClick={() => setMode("current")}
              className={`border-l border-black/10 px-3 py-1 ${mode === "current" ? "bg-primary/20 font-medium" : "hover:bg-primary/10"}`}
            >
              Current
            </button>
            <button
              onClick={() => setMode("proposed")}
              className={`border-l border-black/10 px-3 py-1 ${mode === "proposed" ? "bg-primary/20 font-medium" : "hover:bg-primary/10"}`}
            >
              Proposed
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {mode === "compare" ? (
        <div className="relative flex min-h-0 flex-1">
          {/* Current panel */}
          <div className="flex flex-1 flex-col border-r border-black/10">
            <div className="shrink-0 border-b border-black/10 bg-muted/50 px-3 py-1.5">
              <p className="text-xs font-medium text-muted-foreground">Current</p>
            </div>
            <div
              ref={leftScrollRef}
              onScroll={() => syncScroll("left")}
              onMouseDown={handleMouseDownCompare}
              onMouseMove={handleMouseMoveCompare}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`min-h-0 flex-1 overflow-auto bg-black/5 ${cursorClass} ${zoom <= 1 ? "flex items-center justify-center" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentSrc}
                alt={`Current ${filename}`}
                draggable={false}
                onLoad={updateScrollPos}
                style={{
                  width: zoom <= 1 ? "auto" : `${zoom * 100}%`,
                  maxWidth: zoom <= 1 ? "100%" : "none",
                  maxHeight: zoom <= 1 ? "100%" : "none",
                }}
              />
            </div>
          </div>

          {/* Proposed panel */}
          <div className="flex flex-1 flex-col">
            <div className="shrink-0 border-b border-black/10 bg-muted/50 px-3 py-1.5">
              <p className="text-xs font-medium text-muted-foreground">Proposed</p>
            </div>
            <div
              ref={rightScrollRef}
              onScroll={() => syncScroll("right")}
              onMouseDown={handleMouseDownCompare}
              onMouseMove={handleMouseMoveCompare}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`min-h-0 flex-1 overflow-auto bg-black/5 ${cursorClass} ${zoom <= 1 ? "flex items-center justify-center" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proposedSrc}
                alt={`Proposed ${filename}`}
                draggable={false}
                style={{
                  width: zoom <= 1 ? "auto" : `${zoom * 100}%`,
                  maxWidth: zoom <= 1 ? "100%" : "none",
                  maxHeight: zoom <= 1 ? "100%" : "none",
                }}
              />
            </div>
          </div>

          <MiniMap src={currentSrc} scrollPos={scrollPos} onNavigate={handleNavigate} />
        </div>
      ) : (
        <div className="relative min-h-0 flex-1">
          <div
            ref={singleScrollRef}
            onScroll={updateScrollPos}
            onMouseDown={handleMouseDownSingle}
            onMouseMove={handleMouseMoveSingle}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`absolute inset-0 overflow-auto bg-black/5 ${cursorClass} ${zoom <= 1 ? "flex items-center justify-center" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mode === "current" ? currentSrc : proposedSrc}
              alt={`${mode === "current" ? "Current" : "Proposed"} ${filename}`}
              draggable={false}
              onLoad={updateScrollPos}
              style={{
                width: zoom <= 1 ? "auto" : `${zoom * 100}%`,
                maxWidth: zoom <= 1 ? "100%" : "none",
                maxHeight: zoom <= 1 ? "100%" : "none",
              }}
            />
          </div>
          <MiniMap
            src={mode === "current" ? currentSrc : proposedSrc}
            scrollPos={scrollPos}
            onNavigate={handleNavigate}
          />
        </div>
      )}
    </div>
  );
}

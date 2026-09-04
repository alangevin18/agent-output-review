"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { FileAction } from "@/types";
import { ActionPill } from "./file-preview";

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

  // Don't show if content fits in view
  if (scrollWidth <= viewWidth && scrollHeight <= viewHeight) return null;

  // Calculate box position and size as percentages
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
      {/* Viewport indicator box */}
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingCenterRef = useRef<{ x: number; y: number } | null>(null);
  const src = `/api/files/${seedPath}`;

  const updateScrollPos = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    setScrollPos({
      left: container.scrollLeft,
      top: container.scrollTop,
      viewWidth: container.clientWidth,
      viewHeight: container.clientHeight,
      scrollWidth: container.scrollWidth,
      scrollHeight: container.scrollHeight,
    });
  }, []);

  // Update scroll position on scroll
  const handleScroll = useCallback(() => {
    updateScrollPos();
  }, [updateScrollPos]);

  // After zoom changes, restore center if we have a pending center
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !pendingCenterRef.current) return;

    const { x: centerX, y: centerY } = pendingCenterRef.current;
    pendingCenterRef.current = null;

    // Scroll to keep centerX, centerY at the center of viewport
    const newScrollLeft = centerX * container.scrollWidth - container.clientWidth / 2;
    const newScrollTop = centerY * container.scrollHeight - container.clientHeight / 2;

    container.scrollLeft = Math.max(0, newScrollLeft);
    container.scrollTop = Math.max(0, newScrollTop);
    updateScrollPos();
  }, [zoom, updateScrollPos]);

  // Initialize scroll position
  useEffect(() => {
    updateScrollPos();
  }, [updateScrollPos]);

  const handleZoom = (newZoom: number) => {
    const container = scrollRef.current;
    if (container && container.scrollWidth > 0 && container.scrollHeight > 0) {
      // Store current center as ratio of content
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
    const container = scrollRef.current;
    if (!container) return;
    const targetX = percentX * container.scrollWidth - container.clientWidth / 2;
    const targetY = percentY * container.scrollHeight - container.clientHeight / 2;
    container.scrollTo({
      left: Math.max(0, targetX),
      top: Math.max(0, targetY),
      behavior: "smooth",
    });
  };

  // Drag to pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      scrollX: scrollRef.current?.scrollLeft || 0,
      scrollY: scrollRef.current?.scrollTop || 0,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    scrollRef.current.scrollLeft = dragStart.scrollX - dx;
    scrollRef.current.scrollTop = dragStart.scrollY - dy;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`absolute inset-0 overflow-auto bg-black/5 ${
            zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""
          } ${zoom <= 1 ? "flex items-center justify-center" : ""}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={filename}
            draggable={false}
            onLoad={updateScrollPos}
            style={{
              width: zoom <= 1 ? "auto" : `${zoom * 100}%`,
              height: zoom <= 1 ? "auto" : "auto",
              maxWidth: zoom <= 1 ? "100%" : "none",
              maxHeight: zoom <= 1 ? "100%" : "none",
            }}
          />
        </div>
        <MiniMap src={src} scrollPos={scrollPos} onNavigate={handleNavigate} />
      </div>
    </div>
  );
}

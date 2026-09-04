"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

export function Tooltip({
  text,
  children,
  delay = 800,
}: {
  text: string;
  children: ReactNode;
  delay?: number;
}) {
  const [show, setShow] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const childRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Check if text is truncated
    const el = childRef.current;
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [text]);

  const handleMouseEnter = () => {
    if (!isTruncated) return;
    timeoutRef.current = setTimeout(() => setShow(true), delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShow(false);
  };

  return (
    <span
      className="relative min-w-0 flex-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span ref={childRef} className="block truncate">
        {children}
      </span>
      {show && (
        <span className="absolute left-0 top-full z-50 mt-1 whitespace-nowrap rounded-md border border-black bg-background px-3 py-1.5 text-sm">
          {text}
        </span>
      )}
    </span>
  );
}

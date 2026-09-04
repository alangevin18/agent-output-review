"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/format";

export function RelativeTime({ iso }: { iso: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(formatRelativeTime(iso));
  }, [iso]);

  // Return empty on server, fill in on client
  return label || null;
}

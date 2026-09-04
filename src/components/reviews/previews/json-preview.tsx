"use client";

import { useEffect, useState } from "react";
import type { FileAction } from "@/types";
import { ActionPill } from "./file-preview";

// Simple syntax highlighting for JSON
function highlightJSON(json: string): React.ReactNode[] {
  const lines = json.split("\n");
  
  return lines.map((line, i) => {
    // Highlight different parts of JSON
    const highlighted = line
      // Property names (keys)
      .replace(
        /("[\w_-]+")(\s*:)/g,
        '<span class="text-blue-600">$1</span>$2'
      )
      // String values
      .replace(
        /:\s*("(?:[^"\\]|\\.)*")/g,
        ': <span class="text-green-600">$1</span>'
      )
      // Numbers
      .replace(
        /:\s*(-?\d+\.?\d*)/g,
        ': <span class="text-amber-600">$1</span>'
      )
      // Booleans and null
      .replace(
        /:\s*(true|false|null)/g,
        ': <span class="text-purple-600">$1</span>'
      );

    return (
      <div key={i} className="flex">
        <span className="w-10 shrink-0 select-none pr-4 text-right text-muted-foreground/50">
          {i + 1}
        </span>
        <span dangerouslySetInnerHTML={{ __html: highlighted }} />
      </div>
    );
  });
}

export function JSONPreview({
  seedPath,
  filename,
  action,
}: {
  seedPath: string;
  filename: string;
  action: FileAction;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/files/${seedPath}`);
        if (!res.ok) throw new Error("Failed to load file");
        const json = await res.json();
        // Pretty-print the JSON for display
        try {
          const parsed = JSON.parse(json.content);
          setContent(JSON.stringify(parsed, null, 2));
        } catch {
          // If parsing fails, show raw content
          setContent(json.content);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [seedPath]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-500">{error || "Failed to load"}</p>
      </div>
    );
  }

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
      </div>

      {/* Code container */}
      <div className="min-h-0 flex-1 overflow-auto bg-white p-4">
        <pre className="font-mono text-xs leading-relaxed">
          {highlightJSON(content)}
        </pre>
      </div>
    </div>
  );
}

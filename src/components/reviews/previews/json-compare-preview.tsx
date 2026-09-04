"use client";

import { useEffect, useState } from "react";
import type { FileAction } from "@/types";
import { ActionPill } from "./file-preview";

type ViewMode = "compare" | "current" | "proposed";

type DiffLine = {
  type: "unchanged" | "added" | "removed";
  content: string;
  lineNum?: number;
};

function computeJSONDiff(currentJSON: string, proposedJSON: string): DiffLine[] {
  const currentLines = currentJSON.split("\n");
  const proposedLines = proposedJSON.split("\n");
  const diff: DiffLine[] = [];

  // Simple line-by-line diff (works well for formatted JSON)
  const maxLen = Math.max(currentLines.length, proposedLines.length);
  let currentIdx = 0;
  let proposedIdx = 0;

  while (currentIdx < currentLines.length || proposedIdx < proposedLines.length) {
    const currentLine = currentLines[currentIdx];
    const proposedLine = proposedLines[proposedIdx];

    if (currentLine === proposedLine) {
      diff.push({ type: "unchanged", content: currentLine || "" });
      currentIdx++;
      proposedIdx++;
    } else if (currentLine && !proposedLines.slice(proposedIdx).includes(currentLine)) {
      // Line was removed
      diff.push({ type: "removed", content: currentLine });
      currentIdx++;
    } else if (proposedLine && !currentLines.slice(currentIdx).includes(proposedLine)) {
      // Line was added
      diff.push({ type: "added", content: proposedLine });
      proposedIdx++;
    } else {
      // Lines differ - show removal then addition
      if (currentLine !== undefined) {
        diff.push({ type: "removed", content: currentLine });
        currentIdx++;
      }
      if (proposedLine !== undefined) {
        diff.push({ type: "added", content: proposedLine });
        proposedIdx++;
      }
    }
  }

  return diff;
}

// Apply syntax highlighting to a JSON line
function highlightJSONLine(line: string): string {
  return line
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
}

function DiffView({ diff }: { diff: DiffLine[] }) {
  return (
    <pre className="font-mono text-xs leading-relaxed">
      {diff.map((line, i) => (
        <div
          key={i}
          className={`flex px-2 ${
            line.type === "added"
              ? "bg-green-100"
              : line.type === "removed"
                ? "bg-red-100"
                : ""
          }`}
        >
          <span
            className={`mr-2 inline-block w-4 shrink-0 select-none ${
              line.type === "added"
                ? "text-green-600"
                : line.type === "removed"
                  ? "text-red-600"
                  : "text-muted-foreground"
            }`}
          >
            {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
          </span>
          <span dangerouslySetInnerHTML={{ __html: highlightJSONLine(line.content) }} />
        </div>
      ))}
    </pre>
  );
}

function JSONView({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <pre className="font-mono text-xs leading-relaxed">
      {lines.map((line, i) => (
        <div key={i} className="flex">
          <span className="w-10 shrink-0 select-none pr-4 text-right text-muted-foreground/50">
            {i + 1}
          </span>
          <span dangerouslySetInnerHTML={{ __html: highlightJSONLine(line) }} />
        </div>
      ))}
    </pre>
  );
}

export function JSONComparePreview({
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
  const [currentContent, setCurrentContent] = useState<string | null>(null);
  const [proposedContent, setProposedContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>("compare");

  useEffect(() => {
    async function fetchData() {
      try {
        const [currentRes, proposedRes] = await Promise.all([
          fetch(`/api/files/project-files/${currentPath}`),
          fetch(`/api/files/${proposedPath}`),
        ]);

        if (!currentRes.ok || !proposedRes.ok) {
          throw new Error("Failed to load files");
        }

        const [currentJson, proposedJson] = await Promise.all([
          currentRes.json(),
          proposedRes.json(),
        ]);

        // Pretty-print both
        try {
          const currentParsed = JSON.parse(currentJson.content);
          const proposedParsed = JSON.parse(proposedJson.content);
          setCurrentContent(JSON.stringify(currentParsed, null, 2));
          setProposedContent(JSON.stringify(proposedParsed, null, 2));
        } catch {
          setCurrentContent(currentJson.content);
          setProposedContent(proposedJson.content);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentPath, proposedPath]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !currentContent || !proposedContent) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-500">{error || "Failed to load"}</p>
      </div>
    );
  }

  const diff = computeJSONDiff(currentContent, proposedContent);

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
        <div className="flex rounded border border-black/10 text-xs">
          <button
            onClick={() => setMode("compare")}
            className={`px-3 py-1 ${
              mode === "compare" ? "bg-primary/20 font-medium" : "hover:bg-primary/10"
            }`}
          >
            Compare
          </button>
          <button
            onClick={() => setMode("current")}
            className={`border-l border-black/10 px-3 py-1 ${
              mode === "current" ? "bg-primary/20 font-medium" : "hover:bg-primary/10"
            }`}
          >
            Current
          </button>
          <button
            onClick={() => setMode("proposed")}
            className={`border-l border-black/10 px-3 py-1 ${
              mode === "proposed" ? "bg-primary/20 font-medium" : "hover:bg-primary/10"
            }`}
          >
            Proposed
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto bg-white p-4">
        {mode === "compare" && <DiffView diff={diff} />}
        {mode === "current" && <JSONView content={currentContent} />}
        {mode === "proposed" && <JSONView content={proposedContent} />}
      </div>
    </div>
  );
}

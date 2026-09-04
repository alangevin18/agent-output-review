"use client";

import { useEffect, useState } from "react";
import type { FileAction } from "@/types";
import { ActionPill } from "./file-preview";

type ViewMode = "compare" | "proposed" | "current";

type DiffLine = {
  type: "unchanged" | "added" | "removed";
  content: string;
};

function computeTextDiff(current: string, proposed: string): DiffLine[] {
  const currentLines = current.split("\n");
  const proposedLines = proposed.split("\n");
  const diff: DiffLine[] = [];

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
      diff.push({ type: "removed", content: currentLine });
      currentIdx++;
    } else if (proposedLine && !currentLines.slice(currentIdx).includes(proposedLine)) {
      diff.push({ type: "added", content: proposedLine });
      proposedIdx++;
    } else {
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

function DiffView({ diff }: { diff: DiffLine[] }) {
  return (
    <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
      {diff.map((line, i) => (
        <div
          key={i}
          className={`px-2 ${
            line.type === "added"
              ? "bg-green-100 text-green-800"
              : line.type === "removed"
                ? "bg-red-100 text-red-800"
                : ""
          }`}
        >
          <span className="mr-2 inline-block w-4 select-none text-muted-foreground">
            {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
          </span>
          {line.content}
        </div>
      ))}
    </pre>
  );
}

// Simple markdown renderer
function renderMarkdown(md: string): string {
  let html = md
    .replace(/^### (.*)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*)$/gm, '<h2 class="text-lg font-semibold mt-5 mb-2">$1</h2>')
    .replace(/^# (.*)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3">$1</h1>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code class="bg-black/5 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\n\n/g, "</p><p class='my-2'>")
    .replace(/\n/g, "<br />");

  return `<p class="my-2">${html}</p>`;
}

function RenderedView({ content }: { content: string }) {
  return (
    <div
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}

export function MarkdownComparePreview({
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

        setCurrentContent(currentJson.content);
        setProposedContent(proposedJson.content);
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

  const diff = computeTextDiff(currentContent, proposedContent);

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
            onClick={() => setMode("proposed")}
            className={`border-l border-black/10 px-3 py-1 ${
              mode === "proposed" ? "bg-primary/20 font-medium" : "hover:bg-primary/10"
            }`}
          >
            Proposed
          </button>
          <button
            onClick={() => setMode("current")}
            className={`border-l border-black/10 px-3 py-1 ${
              mode === "current" ? "bg-primary/20 font-medium" : "hover:bg-primary/10"
            }`}
          >
            Current
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto p-6">
        {mode === "compare" && <DiffView diff={diff} />}
        {mode === "proposed" && <RenderedView content={proposedContent} />}
        {mode === "current" && <RenderedView content={currentContent} />}
      </div>
    </div>
  );
}

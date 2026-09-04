"use client";

import { useEffect, useState } from "react";
import type { FileAction } from "@/lib/data/types";
import { ActionPill } from "./file-preview";

type ViewMode = "rendered" | "source";

// Simple markdown renderer (handles common cases)
function renderMarkdown(md: string): string {
  // First, handle tables
  const tableRegex = /^\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/gm;
  let html = md.replace(tableRegex, (_, headerRow, bodyRows) => {
    const headers = headerRow
      .split("|")
      .map((h: string) => h.trim())
      .filter(Boolean);
    const rows = bodyRows
      .trim()
      .split("\n")
      .map((row: string) =>
        row
          .split("|")
          .map((c: string) => c.trim())
          .filter(Boolean)
      );

    const headerHtml = headers
      .map(
        (h: string) =>
          `<th class="border border-black/10 px-3 py-2 text-left font-medium bg-sidebar">${h}</th>`
      )
      .join("");
    const bodyHtml = rows
      .map(
        (row: string[]) =>
          `<tr>${row.map((c) => `<td class="border border-black/10 px-3 py-1.5">${c}</td>`).join("")}</tr>`
      )
      .join("");

    return `<table class="w-full border-collapse my-4 text-sm"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
  });

  html = html
    // Code blocks
    .replace(
      /```(\w*)\n([\s\S]*?)```/g,
      '<pre class="bg-black/5 rounded p-3 my-3 overflow-x-auto"><code class="text-xs font-mono">$2</code></pre>'
    )
    // Inline code
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-black/5 px-1 py-0.5 rounded text-xs font-mono">$1</code>'
    )
    // Headers
    .replace(/^### (.*)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*)$/gm, '<h2 class="text-lg font-semibold mt-5 mb-2">$1</h2>')
    .replace(/^# (.*)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3">$1</h1>')
    // Bold and italic
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    // Links
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-blue-600 underline">$1</a>'
    )
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-4 border-black/10" />');

  // Handle numbered lists - wrap consecutive items in <ol>
  html = html.replace(
    /(^|\n)((?:\d+\. .+\n?)+)/gm,
    (_, before, listBlock) => {
      const items = listBlock
        .trim()
        .split("\n")
        .map((line: string) => {
          const match = line.match(/^\d+\. (.+)$/);
          return match ? `<li>${match[1]}</li>` : line;
        })
        .join("");
      return `${before}<ol class="ml-6 list-decimal my-2 space-y-1">${items}</ol>`;
    }
  );

  // Handle bullet lists - wrap consecutive items in <ul>
  html = html.replace(
    /(^|\n)((?:- .+\n?)+)/gm,
    (_, before, listBlock) => {
      const items = listBlock
        .trim()
        .split("\n")
        .map((line: string) => {
          const match = line.match(/^- (.+)$/);
          return match ? `<li>${match[1]}</li>` : line;
        })
        .join("");
      return `${before}<ul class="ml-6 list-disc my-2 space-y-1">${items}</ul>`;
    }
  );

  // Paragraphs (wrap text blocks)
  html = html.replace(/\n\n/g, "</p><p class='my-2'>");
  // Line breaks
  html = html.replace(/\n/g, "<br />");

  return `<p class="my-2">${html}</p>`;
}

export function MarkdownPreview({
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
  const [mode, setMode] = useState<ViewMode>("rendered");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/files/${seedPath}`);
        if (!res.ok) throw new Error("Failed to load file");
        const json = await res.json();
        setContent(json.content);
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
      {/* Header with tabs */}
      <div className="flex shrink-0 items-center justify-between border-b border-black/10 bg-sidebar px-4 py-2">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium">{filename}</p>
            <p className="text-xs text-muted-foreground">{seedPath}</p>
          </div>
          <ActionPill action={action} />
        </div>
        <div className="flex rounded border border-black/10 text-xs">
          <button
            onClick={() => setMode("rendered")}
            className={`px-3 py-1 ${
              mode === "rendered"
                ? "bg-primary/20 font-medium"
                : "hover:bg-primary/10"
            }`}
          >
            Rendered
          </button>
          <button
            onClick={() => setMode("source")}
            className={`border-l border-black/10 px-3 py-1 ${
              mode === "source"
                ? "bg-primary/20 font-medium"
                : "hover:bg-primary/10"
            }`}
          >
            Source
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto p-6">
        {mode === "rendered" ? (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        ) : (
          <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}

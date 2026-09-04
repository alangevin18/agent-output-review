"use client";

import { useEffect, useState } from "react";
import type { FileAction } from "@/types";
import { ActionPill } from "./file-preview";

type ViewMode = "rendered" | "source";

// Simple markdown renderer (handles common cases)
function renderMarkdown(md: string): string {
  // Process line by line for better control
  const lines = md.split("\n");
  const result: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Handle code blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        result.push(
          `<pre class="bg-black/5 rounded p-3 my-3 overflow-x-auto"><code class="text-xs font-mono">${codeBlockContent.join("\n")}</code></pre>`
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        if (inList) {
          result.push(inList === "ul" ? "</ul>" : "</ol>");
          inList = null;
        }
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Check for list items
    const bulletMatch = line.match(/^- (.+)$/);
    const numberMatch = line.match(/^\d+\. (.+)$/);

    if (bulletMatch) {
      if (inList !== "ul") {
        if (inList) result.push("</ol>");
        result.push('<ul class="ml-6 list-disc my-2 space-y-1">');
        inList = "ul";
      }
      result.push(`<li>${formatInline(bulletMatch[1])}</li>`);
      continue;
    }

    if (numberMatch) {
      if (inList !== "ol") {
        if (inList) result.push("</ul>");
        result.push('<ol class="ml-6 list-decimal my-2 space-y-1">');
        inList = "ol";
      }
      result.push(`<li>${formatInline(numberMatch[1])}</li>`);
      continue;
    }

    // Close any open list
    if (inList && line.trim() !== "") {
      result.push(inList === "ul" ? "</ul>" : "</ol>");
      inList = null;
    }

    // Handle tables
    if (line.startsWith("|") && lines[i + 1]?.match(/^\|[-| ]+\|$/)) {
      if (inList) {
        result.push(inList === "ul" ? "</ul>" : "</ol>");
        inList = null;
      }
      const headers = line.split("|").map((h) => h.trim()).filter(Boolean);
      i++; // Skip separator line
      const rows: string[][] = [];
      while (lines[i + 1]?.startsWith("|")) {
        i++;
        rows.push(lines[i].split("|").map((c) => c.trim()).filter(Boolean));
      }
      const headerHtml = headers
        .map((h) => `<th class="border border-black/10 px-3 py-2 text-left font-medium bg-sidebar">${formatInline(h)}</th>`)
        .join("");
      const bodyHtml = rows
        .map((row) => `<tr>${row.map((c) => `<td class="border border-black/10 px-3 py-1.5">${formatInline(c)}</td>`).join("")}</tr>`)
        .join("");
      result.push(`<table class="w-full border-collapse my-4 text-sm"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`);
      continue;
    }

    // Headers
    if (line.startsWith("### ")) {
      result.push(`<h3 class="text-base font-semibold mt-4 mb-2">${formatInline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      result.push(`<h2 class="text-lg font-semibold mt-5 mb-2">${formatInline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      result.push(`<h1 class="text-xl font-bold mt-6 mb-3">${formatInline(line.slice(2))}</h1>`);
      continue;
    }

    // Horizontal rule
    if (line === "---") {
      result.push('<hr class="my-4 border-black/10" />');
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      result.push("<br />");
      continue;
    }

    // Regular paragraph
    result.push(`<p class="my-2">${formatInline(line)}</p>`);
  }

  // Close any remaining list
  if (inList) {
    result.push(inList === "ul" ? "</ul>" : "</ol>");
  }

  return result.join("\n");
}

// Format inline elements (bold, italic, code, links)
function formatInline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code class="bg-black/5 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>');
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

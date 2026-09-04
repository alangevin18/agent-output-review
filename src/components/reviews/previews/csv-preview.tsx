"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FileAction } from "@/types";
import { ActionPill } from "./file-preview";

type CSVData = {
  headers: string[];
  rows: string[][];
  totalRows: number;
  totalCols: number;
};

const ROWS_PER_PAGE = 100;

function parseCSV(content: string): CSVData {
  const lines = content.trim().split("\n");
  if (lines.length === 0) {
    return { headers: [], rows: [], totalRows: 0, totalCols: 0 };
  }

  // Simple CSV parsing (handles basic cases)
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);

  return {
    headers,
    rows,
    totalRows: rows.length,
    totalCols: headers.length,
  };
}

export function CSVPreview({
  seedPath,
  filename,
  action,
  showHeader = true,
}: {
  seedPath: string;
  filename: string;
  action: FileAction;
  showHeader?: boolean;
}) {
  const [data, setData] = useState<CSVData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/files/${seedPath}`);
        if (!res.ok) throw new Error("Failed to load file");
        const json = await res.json();
        setData(parseCSV(json.content));
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

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-500">{error || "Failed to load"}</p>
      </div>
    );
  }

  const totalPages = Math.ceil(data.totalRows / ROWS_PER_PAGE);
  const startRow = page * ROWS_PER_PAGE;
  const endRow = Math.min(startRow + ROWS_PER_PAGE, data.totalRows);
  const visibleRows = data.rows.slice(startRow, endRow);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-black/10 bg-sidebar px-4 py-2">
        {showHeader && (
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-medium">{filename}</p>
              <p className="text-xs text-muted-foreground">{seedPath}</p>
            </div>
            <ActionPill action={action} />
          </div>
        )}
        <p className={`text-xs text-muted-foreground ${!showHeader ? "ml-auto" : ""}`}>
          {data.totalRows.toLocaleString()} rows · {data.totalCols} columns
        </p>
      </div>

      {/* Table container */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-sidebar">
            <tr>
              {data.headers.map((header, i) => (
                <th
                  key={i}
                  className="border-b border-r border-black/10 px-3 py-2 text-left font-medium"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr key={startRow + rowIndex} className="hover:bg-primary/10">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="border-b border-r border-black/5 px-3 py-1.5 font-mono text-xs"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {totalPages > 1 && (
        <div className="flex shrink-0 items-center justify-between border-t border-black/10 bg-sidebar px-4 py-2">
          <p className="text-xs text-muted-foreground">
            Showing {startRow + 1}–{endRow} of {data.totalRows.toLocaleString()}{" "}
            rows
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded p-1 hover:bg-primary/30 disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded p-1 hover:bg-primary/30 disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

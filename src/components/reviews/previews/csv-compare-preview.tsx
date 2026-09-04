"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FileAction } from "@/types";
import { ActionPill } from "./file-preview";

type ViewMode = "changes" | "proposed" | "current";

type CSVData = {
  headers: string[];
  rows: string[][];
};

type RowChange = {
  rowIndex: number;
  idValue: string; // Value of the first column (identifier)
  allValues: { column: string; current: string; proposed: string; changed: boolean }[];
};

const ROWS_PER_PAGE = 100;

function parseCSV(content: string): CSVData {
  const lines = content.trim().split("\n");
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

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

  return { headers, rows };
}

function findChanges(current: CSVData, proposed: CSVData): RowChange[] {
  const changes: RowChange[] = [];

  // Build a map of current rows by first column (ID column)
  const currentMap = new Map<string, { rowIndex: number; values: string[] }>();
  current.rows.forEach((row, idx) => {
    if (row[0]) {
      currentMap.set(row[0], { rowIndex: idx, values: row });
    }
  });

  // Compare proposed rows against current
  proposed.rows.forEach((proposedRow, proposedIdx) => {
    const key = proposedRow[0];
    const currentEntry = currentMap.get(key);

    if (currentEntry) {
      const allValues: RowChange["allValues"] = [];
      let hasChanges = false;

      // Start from column 1 (skip the ID column which we show separately)
      for (let col = 1; col < Math.max(proposedRow.length, currentEntry.values.length); col++) {
        const currentVal = currentEntry.values[col] || "";
        const proposedVal = proposedRow[col] || "";
        const changed = currentVal !== proposedVal;

        if (changed) hasChanges = true;

        allValues.push({
          column: proposed.headers[col] || `Column ${col + 1}`,
          current: currentVal,
          proposed: proposedVal,
          changed,
        });
      }

      if (hasChanges) {
        changes.push({
          rowIndex: proposedIdx + 1, // 1-indexed for display
          idValue: key, // The identifier (first column value)
          allValues,
        });
      }
    }
  });

  return changes;
}

function ChangesView({
  changes,
  headers,
}: {
  changes: RowChange[];
  headers: string[];
}) {
  if (changes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No changes detected</p>
      </div>
    );
  }

  // Get the ID column (first column)
  const idColumn = headers[0] || "ID";

  // Find which columns actually have changes (to show Current/Proposed for those)
  const changedColumnSet = new Set<string>();
  changes.forEach((change) => {
    change.allValues.forEach((v) => {
      if (v.changed) changedColumnSet.add(v.column);
    });
  });

  // Separate unchanged columns (identifiers) from changed columns
  const unchangedColumns = headers.slice(1).filter((h) => !changedColumnSet.has(h));
  const changedColumns = headers.slice(1).filter((h) => changedColumnSet.has(h));

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-sidebar">
          <tr>
            <th className="border-b border-r border-black/10 px-3 py-2 text-left font-medium">
              Row
            </th>
            <th className="border-b border-r border-black/10 px-3 py-2 text-left font-medium">
              {idColumn}
            </th>
            {unchangedColumns.map((col) => (
              <th
                key={col}
                className="border-b border-r border-black/10 px-3 py-2 text-left font-medium text-muted-foreground"
              >
                {col}
              </th>
            ))}
            {changedColumns.map((col) => (
              <th
                key={col}
                className="border-b border-r border-black/10 px-3 py-2 text-left font-medium"
                colSpan={2}
              >
                {col}
              </th>
            ))}
          </tr>
          <tr className="bg-muted/30">
            <th className="border-b border-r border-black/10 px-3 py-1"></th>
            <th className="border-b border-r border-black/10 px-3 py-1"></th>
            {unchangedColumns.map((col) => (
              <th key={col} className="border-b border-r border-black/10 px-3 py-1"></th>
            ))}
            {changedColumns.map((col) => (
              <React.Fragment key={col}>
                <th className="border-b border-r border-black/10 bg-red-50 px-3 py-1 text-xs font-normal text-red-600">
                  Current
                </th>
                <th className="border-b border-r border-black/10 bg-green-50 px-3 py-1 text-xs font-normal text-green-600">
                  Proposed
                </th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {changes.map((change) => {
            const valuesMap = new Map(change.allValues.map((v) => [v.column, v]));

            return (
              <tr key={change.rowIndex} className="hover:bg-primary/10">
                <td className="border-b border-r border-black/5 px-3 py-1.5 font-mono text-xs text-muted-foreground">
                  {change.rowIndex}
                </td>
                <td className="border-b border-r border-black/5 px-3 py-1.5 font-mono text-xs font-medium">
                  {change.idValue}
                </td>
                {unchangedColumns.map((col) => {
                  const val = valuesMap.get(col);
                  return (
                    <td
                      key={col}
                      className="border-b border-r border-black/5 px-3 py-1.5 font-mono text-xs text-muted-foreground"
                    >
                      {val?.proposed || ""}
                    </td>
                  );
                })}
                {changedColumns.map((col) => {
                  const val = valuesMap.get(col);
                  return (
                    <React.Fragment key={col}>
                      <td className="border-b border-r border-black/5 bg-red-50 px-3 py-1.5 font-mono text-xs text-red-700">
                        {val?.current || ""}
                      </td>
                      <td className="border-b border-r border-black/5 bg-green-50 px-3 py-1.5 font-mono text-xs text-green-700">
                        {val?.proposed || ""}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TableView({ data, label }: { data: CSVData; label: string }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(data.rows.length / ROWS_PER_PAGE);
  const startRow = page * ROWS_PER_PAGE;
  const endRow = Math.min(startRow + ROWS_PER_PAGE, data.rows.length);
  const visibleRows = data.rows.slice(startRow, endRow);

  return (
    <div className="flex h-full flex-col">
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

      {totalPages > 1 && (
        <div className="flex shrink-0 items-center justify-between border-t border-black/10 bg-sidebar px-4 py-2">
          <p className="text-xs text-muted-foreground">
            Showing {startRow + 1}–{endRow} of {data.rows.length} rows
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

export function CSVComparePreview({
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
  const [currentData, setCurrentData] = useState<CSVData | null>(null);
  const [proposedData, setProposedData] = useState<CSVData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>("changes");

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

        setCurrentData(parseCSV(currentJson.content));
        setProposedData(parseCSV(proposedJson.content));
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

  if (error || !currentData || !proposedData) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-500">{error || "Failed to load"}</p>
      </div>
    );
  }

  const changes = findChanges(currentData, proposedData);

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
          {mode === "changes" && (
            <span className="text-xs text-muted-foreground">
              {changes.length} row{changes.length !== 1 ? "s" : ""} changed
            </span>
          )}
        </div>
        <div className="flex rounded border border-black/10 text-xs">
          <button
            onClick={() => setMode("changes")}
            className={`px-3 py-1 ${
              mode === "changes" ? "bg-primary/20 font-medium" : "hover:bg-primary/10"
            }`}
          >
            Changes
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
      <div className="min-h-0 flex-1">
        {mode === "changes" && (
          <ChangesView changes={changes} headers={proposedData.headers} />
        )}
        {mode === "proposed" && <TableView data={proposedData} label="Proposed" />}
        {mode === "current" && <TableView data={currentData} label="Current" />}
      </div>
    </div>
  );
}

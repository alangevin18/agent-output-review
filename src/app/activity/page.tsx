"use client";

import { useState, useMemo } from "react";
import { useSubmissions } from "@/lib/submissions-context";
import { Search, ChevronDown, ChevronRight, Check } from "lucide-react";
import type { ActivityEntry } from "@/types/db";
import type { SubmissionFile } from "@/types";

type ActivityFilter = "all" | "merged" | "none_merged";
type DateFilter = "any" | "today" | "7days" | "30days";

const activityFilterLabels: Record<ActivityFilter, string> = {
  all: "All activity",
  merged: "Merged changes",
  none_merged: "No changes merged",
};

const dateFilterLabels: Record<DateFilter, string> = {
  any: "Any time",
  today: "Today",
  "7days": "Past 7 days",
  "30days": "Past 30 days",
};

function FilterDropdown<T extends string>({
  value,
  options,
  labels,
  onChange,
}: {
  value: T;
  options: T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md border border-black/20 bg-white px-3 py-1.5 text-sm hover:bg-muted/50"
      >
        {labels[value]}
        <ChevronDown className="size-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-md border border-black bg-white py-1 shadow-lg">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted"
              >
                <span className="w-4">
                  {value === option && <Check className="size-3.5" />}
                </span>
                {labels[option]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function formatActivityDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ActivityItem({
  item,
  fileMap,
}: {
  item: ActivityEntry;
  fileMap: Map<string, SubmissionFile>;
}) {
  const [expanded, setExpanded] = useState(false);

  const approvedFiles = item.approvedFileIds
    .map((id) => fileMap.get(id))
    .filter(Boolean) as SubmissionFile[];
  const rejectedFiles = item.rejectedFileIds
    .map((id) => fileMap.get(id))
    .filter(Boolean) as SubmissionFile[];

  return (
    <div className="rounded-lg border border-black/20 bg-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start justify-between gap-4 p-4 text-left"
      >
        <div className="flex items-start gap-2">
          <ChevronRight
            className={`mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          />
          <div>
            <p className="font-medium">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {item.approvedFileIds.length > 0 && (
                <span className="text-emerald-700">
                  {item.approvedFileIds.length} file
                  {item.approvedFileIds.length !== 1 ? "s" : ""} merged
                </span>
              )}
              {item.approvedFileIds.length > 0 &&
                item.rejectedFileIds.length > 0 && <span> · </span>}
              {item.rejectedFileIds.length > 0 && (
                <span>{item.rejectedFileIds.length} rejected</span>
              )}
              {item.approvedFileIds.length === 0 &&
                item.rejectedFileIds.length === 0 && <span>No changes</span>}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatActivityDate(item.finalizedAt)}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-black/10 px-4 pb-4 pt-3">
          {approvedFiles.length > 0 && (
            <div className="mb-3">
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Merged
              </h4>
              <ul className="space-y-1">
                {approvedFiles.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="font-mono text-xs text-muted-foreground w-4">
                      {file.action === "created" && "+"}
                      {file.action === "updated" && "~"}
                      {file.action === "deleted" && "−"}
                    </span>
                    <span>{file.filename}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {rejectedFiles.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Rejected
              </h4>
              <ul className="space-y-1">
                {rejectedFiles.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="font-mono text-xs w-4">
                      {file.action === "created" && "+"}
                      {file.action === "updated" && "~"}
                      {file.action === "deleted" && "−"}
                    </span>
                    <span>{file.filename}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ActivityPage() {
  const { activity, submissions } = useSubmissions();

  // Build a map of file ID -> file for quick lookup
  const fileMap = useMemo(() => {
    const map = new Map<string, SubmissionFile>();
    for (const submission of submissions) {
      for (const file of submission.files) {
        map.set(file.id, file);
      }
    }
    return map;
  }, [submissions]);
  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("any");

  const filteredActivity = useMemo(() => {
    let filtered = [...activity];

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(searchLower)
      );
    }

    // Activity type filter
    if (activityFilter === "merged") {
      filtered = filtered.filter((item) => item.approvedFileIds.length > 0);
    } else if (activityFilter === "none_merged") {
      filtered = filtered.filter((item) => item.approvedFileIds.length === 0);
    }

    // Date filter
    if (dateFilter !== "any") {
      const now = new Date();
      const cutoff = new Date();

      if (dateFilter === "today") {
        cutoff.setHours(0, 0, 0, 0);
      } else if (dateFilter === "7days") {
        cutoff.setDate(now.getDate() - 7);
      } else if (dateFilter === "30days") {
        cutoff.setDate(now.getDate() - 30);
      }

      filtered = filtered.filter(
        (item) => new Date(item.finalizedAt) >= cutoff
      );
    }

    // Sort by most recent
    filtered.sort(
      (a, b) =>
        new Date(b.finalizedAt).getTime() - new Date(a.finalizedAt).getTime()
    );

    return filtered;
  }, [activity, search, activityFilter, dateFilter]);

  // Group by relative date
  const groupedActivity = useMemo(() => {
    const groups: { label: string; items: typeof filteredActivity }[] = [];
    let currentLabel = "";

    for (const item of filteredActivity) {
      const label = formatRelativeDate(item.finalizedAt);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, items: [item] });
      } else {
        groups[groups.length - 1].items.push(item);
      }
    }

    return groups;
  }, [filteredActivity]);

  return (
    <div className="w-full px-6 py-6">
      <h1 className="text-lg font-display font-normal">Activity</h1>

      {/* Filters */}
      <div className="mt-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search submissions or files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-black/20 bg-white py-1.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <FilterDropdown
          value={activityFilter}
          options={["all", "merged", "none_merged"]}
          labels={activityFilterLabels}
          onChange={setActivityFilter}
        />

        <FilterDropdown
          value={dateFilter}
          options={["any", "today", "7days", "30days"]}
          labels={dateFilterLabels}
          onChange={setDateFilter}
        />
      </div>

      {/* Activity list */}
      <div className="mt-6">
        {groupedActivity.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {activity.length === 0
              ? "No activity yet"
              : "No activity matches your filters"}
          </p>
        ) : (
          <div className="space-y-6">
            {groupedActivity.map((group) => (
              <div key={group.label}>
                <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h2>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <ActivityItem key={item.id} item={item} fileMap={fileMap} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

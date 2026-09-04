"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  HelpCircle,
  History,
  LayoutGrid,
  PanelLeft,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { StatusIcon } from "@/components/reviews/status-icon";
import { Tooltip } from "@/components/ui/tooltip";
import { useSubmissions } from "@/lib/submissions-context";
import type { Submission } from "@/types";
import {
  reviewProgress,
  sortFilesForReview,
  sortSubmissionsByProgress,
} from "@/lib/utils/review";
import { formatShortDate } from "@/lib/format";

function ExpandChevron({
  open,
  className = "size-3 shrink-0",
}: {
  open: boolean;
  className?: string;
}) {
  const Icon = open ? ChevronDown : ChevronRight;
  return <Icon className={className} strokeWidth={1.75} />;
}

function IconButton({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-primary/30 hover:text-foreground"
    >
      {children}
    </button>
  );
}

function SidebarSection({
  title,
  actionLabel,
  children,
  empty,
  grow = false,
  defaultOpen = true,
}: {
  title: string;
  actionLabel?: string;
  children?: ReactNode;
  empty?: string;
  grow?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasItems = Boolean(children);

  return (
    <section
      className={`flex min-h-0 flex-col border-t border-black ${
        open && grow ? "flex-1" : "flex-none"
      }`}
    >
      <div className="flex h-10 shrink-0 items-center gap-1.5 px-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm font-medium text-foreground"
        >
          <ExpandChevron open={open} className="size-4 shrink-0" />
          {title}
        </button>
        {open ? (
          <>
            <IconButton label={`Search ${title}`}>
              <Search className="size-4" strokeWidth={1.5} />
            </IconButton>
            {actionLabel ? (
              <button
                type="button"
                className="flex h-6 items-center gap-0.5 px-1.5 text-sm font-medium text-foreground hover:bg-primary/30"
              >
                <Plus className="size-3" strokeWidth={1.75} />
                {actionLabel}
              </button>
            ) : null}
            <IconButton label={`${title} layout`}>
              <LayoutGrid className="size-4" strokeWidth={1.5} />
            </IconButton>
          </>
        ) : null}
      </div>
      <div className={`bg-primary ${open ? "h-0.5" : "h-px"}`} />
      {open ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-3">
          {hasItems ? (
            children
          ) : (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              {empty}
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}

function useHydratedPathname() {
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated ? pathname : "";
}

function ReviewItem({ submission }: { submission: Submission }) {
  const pathname = useHydratedPathname();
  const href = `/reviews/${submission.id}`;
  const inSubmission = pathname === href || pathname.startsWith(`${href}/`);
  const [open, setOpen] = useState(inSubmission);
  const { decided, total } = reviewProgress(submission);
  const files = sortFilesForReview(submission.files);

  useEffect(() => {
    if (inSubmission) setOpen(true);
  }, [inSubmission]);

  const isOverviewSelected = pathname === href;

  return (
    <div>
      {/* Top-level submission row */}
      <div className="flex w-full items-center rounded-md py-2 pl-2 pr-3">
        {/* Chevron - expands/collapses */}
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="shrink-0 rounded p-0.5"
        >
          <ExpandChevron open={open} className="size-4" />
        </button>
        {/* Text - navigates to overview */}
        <Link
          href={href}
          className={`ml-1 flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-0.5 ${
            isOverviewSelected ? "bg-primary/30" : "hover:bg-primary/30"
          }`}
        >
          <Tooltip text={submission.title}>
            <span className="text-sm">{submission.title}</span>
          </Tooltip>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {decided === total ? "Ready" : `${decided}/${total}`}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatShortDate(submission.createdAt)}
          </span>
        </Link>
      </div>
      {/* Nested file list */}
      {open ? (
        <ul className="mb-1">
          {files.map((file) => {
            const fileHref = `/reviews/${submission.id}/files/${file.id}`;
            const fileSelected = pathname === fileHref;
            return (
              <li key={file.id}>
                <Link
                  href={fileHref}
                  className={`flex items-center gap-2 rounded-md py-2 pl-6 pr-3 ${
                    fileSelected
                      ? "bg-primary/30"
                      : "hover:bg-primary/30"
                  }`}
                >
                  <StatusIcon status={file.reviewStatus} className="size-3.5 shrink-0" />
                  <Tooltip text={file.filename}>
                    <span className="text-sm">{file.filename}</span>
                  </Tooltip>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function RailItem({
  label,
  active,
  children,
}: {
  label: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`flex w-14 flex-col items-center gap-1 text-[10px] ${
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <span
        className={`flex size-9 items-center justify-center rounded-full ${
          active ? "bg-primary" : "hover:bg-sidebar-accent"
        }`}
      >
        {children}
      </span>
      {label}
    </button>
  );
}

function IconRail() {
  return (
    <nav className="flex w-16 shrink-0 flex-col items-center border-r border-black bg-sidebar py-3">
      <div className="size-8 rounded-full border border-foreground" />
      <div className="mt-6 flex flex-col items-center gap-2">
        <RailItem label="Projects" active>
          <Folder className="size-5" strokeWidth={2.25} />
        </RailItem>
      </div>
      <div className="mt-auto flex flex-col items-center gap-3">
        <RailItem label="Help">
          <HelpCircle className="size-5" strokeWidth={1.75} />
        </RailItem>
        <div
          aria-label="AL"
          className="flex size-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f9a8d4,#c4b5fd)] text-[11px] font-medium text-white"
        >
          AL
        </div>
      </div>
    </nav>
  );
}

function SubmissionCategory({
  title,
  submissions,
  count,
}: {
  title: string;
  submissions: Submission[];
  count: number;
}) {
  const [open, setOpen] = useState(true);

  if (submissions.length === 0) return null;

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-2 py-1 text-left"
      >
        <ExpandChevron open={open} className="size-3" />
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <span className="ml-auto text-xs text-muted-foreground">{count}</span>
      </button>
      {open && (
        <div>
          {submissions.map((submission) => (
            <ReviewItem key={submission.id} submission={submission} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectSidebar() {
  const { submissions, finalizedIds, activity } = useSubmissions();

  // Filter out finalized submissions
  const activeSubmissions = submissions.filter((s) => !finalizedIds.has(s.id));

  // Split active submissions into awaiting review and ready to finalize
  const awaitingReview = activeSubmissions.filter((s) => {
    const { decided, total } = reviewProgress(s);
    return decided < total;
  });
  const readyToFinalize = activeSubmissions.filter((s) => {
    const { decided, total } = reviewProgress(s);
    return decided === total;
  });

  // Sort each category
  const sortedAwaiting = sortSubmissionsByProgress(awaitingReview);
  const sortedReady = sortSubmissionsByProgress(readyToFinalize);

  return (
    <aside className="flex w-[360px] shrink-0 flex-col border-r border-black bg-sidebar">
      <div className="flex items-start justify-between gap-2 px-3 pb-3 pt-3">
        <div className="flex min-w-0 flex-1 flex-col items-start">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Project
          </span>
          <div className="flex min-w-0 max-w-full items-center gap-1.5">
            <h1
              className="block min-w-0 overflow-hidden text-xl font-display font-normal leading-7"
              title="Quick Tasks"
            >
              Quick Tasks
            </h1>
          </div>
        </div>
        <div className="mt-5 flex items-center">
          <IconButton label="Project settings">
            <Settings className="size-4" strokeWidth={1.75} />
          </IconButton>
          <IconButton label="Toggle sidebar">
            <PanelLeft className="size-4" strokeWidth={1.75} />
          </IconButton>
        </div>
      </div>

      <SidebarSection title="Drive" actionLabel="Upload" empty="No files yet" defaultOpen={false} />

      <SidebarSection title="Reviews" grow>
        <SubmissionCategory
          title="Awaiting Review"
          submissions={sortedAwaiting}
          count={awaitingReview.length}
        />
        <SubmissionCategory
          title="Ready to Finalize"
          submissions={sortedReady}
          count={readyToFinalize.length}
        />
        {activeSubmissions.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            No reviews yet
          </p>
        )}
      </SidebarSection>

      {/* Activity link */}
      <div className="border-t border-black/10 px-2 py-2">
        <Link
          href="/activity"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
        >
          <History className="size-4 text-muted-foreground" />
          <span>Activity</span>
          {activity.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">
              {activity.length}
            </span>
          )}
        </Link>
      </div>
    </aside>
  );
}

function TopBar() {
  const { submissions } = useSubmissions();
  const pathname = useHydratedPathname();
  const segments = pathname.split("/").filter(Boolean);
  const submission =
    segments[0] === "reviews"
      ? submissions.find((item) => item.id === segments[1])
      : undefined;
  const file =
    segments[2] === "files"
      ? submission?.files.find((item) => item.id === segments[3])
      : undefined;

  const crumbs = ["Quick Tasks"];
  if (segments[0] === "activity") {
    crumbs.push("Activity");
  } else if (submission) {
    crumbs.push("Reviews");
    if (file) crumbs.push(file.filename);
  }

  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-black bg-background px-4">
      <p className="truncate text-sm text-muted-foreground">
        {crumbs.join(" / ")}
      </p>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full overflow-hidden">
      <IconRail />
      <ProjectSidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <TopBar />
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

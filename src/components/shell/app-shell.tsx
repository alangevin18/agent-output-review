"use client";

import { useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Folder,
  HelpCircle,
  LayoutGrid,
  LayoutTemplate,
  PanelLeft,
  Plus,
  Search,
  Settings,
  Share2,
} from "lucide-react";
import {
  reviewProgress,
  sortFilesForReview,
  sortSubmissionsByProgress,
  type Submission,
} from "@/lib/data/types";

function ExpandChevron({
  open,
  className = "size-3.5 shrink-0",
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
      className="flex size-6 items-center justify-center text-foreground hover:bg-sidebar-accent"
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
      <div className="flex h-9 shrink-0 items-center gap-1.5 px-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm font-medium text-foreground hover:bg-sidebar-accent"
        >
          <ExpandChevron open={open} />
          {title}
        </button>
        {open ? (
          <>
            <IconButton label={`Search ${title}`}>
              <Search className="size-3.5" strokeWidth={1.75} />
            </IconButton>
            {actionLabel ? (
              <button
                type="button"
                className="flex h-6 items-center gap-0.5 px-1.5 text-sm font-medium text-foreground hover:bg-sidebar-accent"
              >
                <Plus className="size-3" strokeWidth={1.75} />
                {actionLabel}
              </button>
            ) : null}
            <IconButton label={`${title} layout`}>
              <LayoutGrid className="size-3.5" strokeWidth={1.75} />
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

function ReviewItem({ submission }: { submission: Submission }) {
  const [open, setOpen] = useState(false);
  const { decided, total } = reviewProgress(submission);
  const files = sortFilesForReview(submission.files);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left hover:bg-sidebar-accent"
      >
        <ExpandChevron open={open} />
        <span className="min-w-0 flex-1 truncate text-sm">
          {submission.title}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {decided}/{total}
          <span className="ml-2">
            {new Date(submission.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </span>
      </button>
      {open ? (
        <ul className="mb-1 ml-2">
          {files.map((file) => {
            const reviewed = file.reviewStatus !== "pending";
            return (
              <li key={file.id}>
                <div className="flex items-center gap-2 px-3 py-1.5">
                  {reviewed ? (
                    <Check
                      className="size-3.5 shrink-0 text-foreground"
                      strokeWidth={2}
                    />
                  ) : (
                    <Circle
                      className="size-3 shrink-0 text-muted-foreground"
                      strokeWidth={1.75}
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {file.filename}
                  </span>
                </div>
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

function ProjectSidebar({ submissions }: { submissions: Submission[] }) {
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
            <ChevronDown className="size-4 shrink-0" strokeWidth={1.75} />
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
        {sortSubmissionsByProgress(submissions).map((submission) => (
          <ReviewItem key={submission.id} submission={submission} />
        ))}
      </SidebarSection>

      <SidebarSection title="Activity" empty="No activity yet" defaultOpen={false} />
    </aside>
  );
}

function TopBar() {
  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-black bg-background px-4">
      <p className="truncate text-sm text-muted-foreground">Quick Tasks</p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex h-7 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Share2 className="size-3.5" strokeWidth={1.75} />
          Share
        </button>
        <button
          type="button"
          className="flex h-7 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LayoutTemplate className="size-3.5" strokeWidth={1.75} />
          Layout
        </button>
      </div>
    </header>
  );
}

export function AppShell({
  submissions,
  children,
}: {
  submissions: Submission[];
  children: ReactNode;
}) {
  return (
    <div className="flex h-full overflow-hidden">
      <IconRail />
      <ProjectSidebar submissions={submissions} />
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <TopBar />
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

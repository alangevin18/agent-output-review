"use client";

import Link from "next/link";
import { RelativeTime } from "@/components/reviews/relative-time";
import { StatusIcon } from "@/components/reviews/status-icon";
import { useSubmissions } from "@/lib/submissions-context";
import { reviewProgress } from "@/lib/data/types";
import { actionLabel, reviewStatusLabel } from "@/lib/format";

export function SubmissionOverview({ submissionId }: { submissionId: string }) {
  const { submissions } = useSubmissions();
  const submission = submissions.find((s) => s.id === submissionId);

  if (!submission) return null;

  const { approved, rejected, pending, decided, total } = reviewProgress(submission);
  const isReadyToMerge = pending === 0 && total > 0;

  return (
    <div className="w-full px-6 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-display font-normal">
            {submission.title}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Agent submission · <RelativeTime iso={submission.createdAt} />
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
            isReadyToMerge
              ? "bg-primary/40 text-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isReadyToMerge ? "Ready to Merge" : "In Review"}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium">
        {decided} of {total} files reviewed
      </p>
      <p className="mt-1 flex gap-6 text-sm text-muted-foreground">
        <span>{approved} approved</span>
        <span>{rejected} rejected</span>
        <span>{pending} pending</span>
      </p>

      <hr className="mt-5 border-black" />

      <h2 className="mt-4 text-sm font-medium">Files</h2>
      <ul className="mt-1">
        {submission.files.map((file) => (
          <li key={file.id}>
            <Link
              href={`/reviews/${submission.id}/files/${file.id}`}
              className="grid grid-cols-[auto_minmax(0,1fr)_5.5rem_5.5rem] items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-primary/30"
            >
              <StatusIcon status={file.reviewStatus} />
              <span className="min-w-0 truncate">{file.filename}</span>
              <span className="text-muted-foreground">
                {actionLabel(file.action)}
              </span>
              <span className="text-right text-muted-foreground">
                {reviewStatusLabel(file.reviewStatus)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { RelativeTime } from "@/components/reviews/relative-time";
import { StatusIcon } from "@/components/reviews/status-icon";
import { useSubmissions } from "@/lib/submissions-context";
import { reviewProgress } from "@/lib/utils/review";
import { actionLabel, reviewStatusLabel } from "@/lib/format";

function FinalizationSummary({
  approvedCreated,
  approvedUpdated,
  approvedDeleted,
  rejectedCount,
  onFinalize,
  isLoading,
}: {
  approvedCreated: number;
  approvedUpdated: number;
  approvedDeleted: number;
  rejectedCount: number;
  onFinalize: () => void;
  isLoading: boolean;
}) {
  const totalApproved = approvedCreated + approvedUpdated + approvedDeleted;
  const hasApproved = totalApproved > 0;

  return (
    <div className="mt-6 rounded-lg border border-black/20 bg-primary/20 p-5">
      <h2 className="text-base font-medium">Ready to finalize</h2>

      {hasApproved ? (
        <div className="mt-4">
          <p className="text-sm">
            <span className="font-medium">{totalApproved} approved change{totalApproved !== 1 ? "s" : ""}</span> will be applied:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {approvedCreated > 0 && (
              <li className="flex items-center gap-2">
                <span className="font-mono">+</span>
                <span>{approvedCreated} created</span>
              </li>
            )}
            {approvedUpdated > 0 && (
              <li className="flex items-center gap-2">
                <span className="font-mono">~</span>
                <span>{approvedUpdated} updated</span>
              </li>
            )}
            {approvedDeleted > 0 && (
              <li className="flex items-center gap-2">
                <span className="font-mono">−</span>
                <span>{approvedDeleted} deleted</span>
              </li>
            )}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No changes will be applied to Project Files.
        </p>
      )}

      {rejectedCount > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          {rejectedCount} rejected change{rejectedCount !== 1 ? "s" : ""} will be discarded.
        </p>
      )}

      <div className="mt-5">
        <button
          type="button"
          onClick={onFinalize}
          disabled={isLoading}
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/80 disabled:opacity-50"
        >
          {isLoading
            ? "Finalizing..."
            : hasApproved
              ? `Finalize & merge ${totalApproved} file${totalApproved !== 1 ? "s" : ""}`
              : "Finalize review"}
        </button>
      </div>
    </div>
  );
}

export function SubmissionOverview({ submissionId }: { submissionId: string }) {
  const { submissions, finalizeSubmission } = useSubmissions();
  const [isLoading, setIsLoading] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const submission = submissions.find((s) => s.id === submissionId);

  if (!submission) return null;

  const { approved, rejected, pending, decided, total } = reviewProgress(submission);
  const isReadyToFinalize = pending === 0 && total > 0;

  // Count approved files by action type
  const approvedFiles = submission.files.filter((f) => f.reviewStatus === "approved");
  const approvedCreated = approvedFiles.filter((f) => f.action === "created").length;
  const approvedUpdated = approvedFiles.filter((f) => f.action === "updated").length;
  const approvedDeleted = approvedFiles.filter((f) => f.action === "deleted").length;

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
            isReadyToFinalize
              ? "bg-primary/40 text-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isReadyToFinalize ? "Ready to Finalize" : "In Review"}
        </span>
      </div>

      {!isReadyToFinalize && (
        <>
          <p className="mt-4 text-sm font-medium">
            {decided} of {total} files reviewed
          </p>
          <p className="mt-1 flex gap-6 text-sm text-muted-foreground">
            <span>{approved} approved</span>
            <span>{rejected} rejected</span>
            <span>{pending} pending</span>
          </p>
        </>
      )}

      {isReadyToFinalize && !finalized && (
        <FinalizationSummary
          approvedCreated={approvedCreated}
          approvedUpdated={approvedUpdated}
          approvedDeleted={approvedDeleted}
          rejectedCount={rejected}
          isLoading={isLoading}
          onFinalize={async () => {
            setIsLoading(true);
            try {
              await finalizeSubmission(submissionId);
              setFinalized(true);
            } catch (error) {
              console.error("Failed to finalize:", error);
            } finally {
              setIsLoading(false);
            }
          }}
        />
      )}

      {finalized && (
        <div className="mt-6 rounded-lg border border-black/20 bg-muted p-5">
          <p className="text-sm font-medium">✓ Submission finalized</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Changes have been recorded.
          </p>
        </div>
      )}

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

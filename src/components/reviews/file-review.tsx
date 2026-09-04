"use client";

import { useState, useEffect } from "react";
import { ReviewPanel } from "@/components/reviews/review-panel";
import { FilePreview } from "@/components/reviews/previews/file-preview";
import { useSubmissions } from "@/lib/submissions-context";
import type { FileReviewStatus } from "@/types";
import type { ConflictStatus } from "@/app/api/files/conflict/route";

export function FileReview({
  submissionId,
  fileId,
}: {
  submissionId: string;
  fileId: string;
}) {
  const { submissions, updateFileStatus } = useSubmissions();
  const submission = submissions.find((s) => s.id === submissionId);
  const file = submission?.files.find((f) => f.id === fileId);
  const [conflict, setConflict] = useState<ConflictStatus | null>(null);

  useEffect(() => {
    if (!file || !submission) return;

    // Check for conflicts
    const params = new URLSearchParams({
      targetPath: file.targetPath,
      action: file.action,
      submissionCreatedAt: submission.createdAt,
    });

    fetch(`/api/files/conflict?${params}`)
      .then((res) => res.json())
      .then(setConflict)
      .catch(console.error);
  }, [file, submission]);

  if (!submission || !file) return null;

  const handleStatusChange = (status: FileReviewStatus) => {
    updateFileStatus(submissionId, fileId, status);
  };

  // Determine effective action for display
  // - created but file exists → show as update (diff)
  // - updated but file deleted → show as create (proposed preview only)
  let effectiveAction = file.action;
  if (conflict?.type === "already_exists") {
    effectiveAction = "updated";
  } else if (conflict?.type === "deleted" && file.action === "updated" && file.seedPath) {
    effectiveAction = "created";
  }

  return (
    <div className="flex h-full">
      {/* Main content area - file preview */}
      <div className="min-w-0 flex-1 overflow-hidden bg-background">
        <FilePreview 
          file={file} 
          conflict={conflict}
          effectiveAction={effectiveAction}
        />
      </div>

      {/* Right sidebar panel */}
      <ReviewPanel
        submissionId={submissionId}
        fileId={fileId}
        initialStatus={file.reviewStatus}
        onStatusChange={handleStatusChange}
        fileAction={file.action}
        conflict={conflict}
      />
    </div>
  );
}

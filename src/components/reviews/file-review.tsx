"use client";

import { ReviewPanel } from "@/components/reviews/review-panel";
import { FilePreview } from "@/components/reviews/previews/file-preview";
import { useSubmissions } from "@/lib/submissions-context";
import type { FileReviewStatus } from "@/types";

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

  if (!submission || !file) return null;

  const handleStatusChange = (status: FileReviewStatus) => {
    updateFileStatus(submissionId, fileId, status);
  };

  return (
    <div className="flex h-full">
      {/* Main content area - file preview */}
      <div className="min-w-0 flex-1 overflow-hidden bg-background">
        <FilePreview file={file} />
      </div>

      {/* Right sidebar panel */}
      <ReviewPanel
        initialStatus={file.reviewStatus}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

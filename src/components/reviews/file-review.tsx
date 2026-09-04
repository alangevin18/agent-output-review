"use client";

import { ReviewPanel } from "@/components/reviews/review-panel";
import type { Submission, SubmissionFile } from "@/lib/data/types";

export function FileReview({
  submission,
  file,
}: {
  submission: Submission;
  file: SubmissionFile;
}) {
  return (
    <div className="flex h-full">
      {/* Main content area - empty for now, will show file preview */}
      <div className="min-w-0 flex-1 overflow-y-auto bg-background">
        <div className="flex h-full items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">
            File preview coming soon
          </p>
        </div>
      </div>

      {/* Right sidebar panel */}
      <ReviewPanel initialStatus={file.reviewStatus} />
    </div>
  );
}

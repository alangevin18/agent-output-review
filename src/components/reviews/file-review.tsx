import { StatusIcon } from "@/components/reviews/status-icon";
import type { Submission, SubmissionFile } from "@/lib/data/types";
import { actionLabel, reviewStatusLabel } from "@/lib/format";

export function FileReview({
  submission,
  file,
}: {
  submission: Submission;
  file: SubmissionFile;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-8">
      <p className="text-sm text-muted-foreground">{submission.title}</p>
      <h1 className="mt-1 text-xl font-display font-normal leading-7">
        {file.filename}
      </h1>
      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <StatusIcon status={file.reviewStatus} />
        {actionLabel(file.action)} · {reviewStatusLabel(file.reviewStatus)}
      </p>
      {file.message ? (
        <p className="mt-4 text-sm">{file.message}</p>
      ) : null}
    </div>
  );
}

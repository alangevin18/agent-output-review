export type FileAction = "created" | "updated" | "deleted";

export type FileReviewStatus = "pending" | "approved" | "rejected";

export type SubmissionFile = {
  id: string;
  filename: string;
  /** Path under `data/seed/` for the proposed bytes. Null when the file is being deleted. */
  seedPath: string | null;
  /** Where this file will land in project files if the submission is merged. */
  targetPath: string;
  mimeType: string | null;
  size: number | null;
  action: FileAction;
  message: string;
  /** Per-file review decision. Pending until approved or rejected. */
  reviewStatus: FileReviewStatus;
};

export type Submission = {
  id: string;
  title: string;
  description: string;
  author: string;
  createdAt: string;
  files: SubmissionFile[];
};

/** Files with an approve/reject decision, over total files. Merge is separate. */
export function reviewProgress(submission: Submission): {
  decided: number;
  total: number;
} {
  const decided = submission.files.filter(
    (file) => file.reviewStatus !== "pending",
  ).length;

  return { decided, total: submission.files.length };
}

export function sortSubmissionsByProgress(
  submissions: Submission[],
): Submission[] {
  return [...submissions].sort((a, b) => {
    const progressA = reviewProgress(a);
    const progressB = reviewProgress(b);
    const ratioA =
      progressA.total === 0 ? 0 : progressA.decided / progressA.total;
    const ratioB =
      progressB.total === 0 ? 0 : progressB.decided / progressB.total;
    if (ratioB !== ratioA) return ratioB - ratioA;

    const remainingA = progressA.total - progressA.decided;
    const remainingB = progressB.total - progressB.decided;
    return remainingA - remainingB;
  });
}

/** Pending files first so the next review is at the top. */
export function sortFilesForReview(
  files: SubmissionFile[],
): SubmissionFile[] {
  return [...files].sort((a, b) => {
    const aPending = a.reviewStatus === "pending" ? 0 : 1;
    const bPending = b.reviewStatus === "pending" ? 0 : 1;
    return aPending - bPending;
  });
}

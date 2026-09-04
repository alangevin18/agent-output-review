import type { Submission, SubmissionFile } from "@/types";

/** Calculate review progress for a submission */
export function reviewProgress(submission: Submission): {
  approved: number;
  rejected: number;
  pending: number;
  decided: number;
  total: number;
} {
  let approved = 0;
  let rejected = 0;
  let pending = 0;

  for (const file of submission.files) {
    if (file.reviewStatus === "approved") approved += 1;
    else if (file.reviewStatus === "rejected") rejected += 1;
    else pending += 1;
  }

  return {
    approved,
    rejected,
    pending,
    decided: approved + rejected,
    total: submission.files.length,
  };
}

/** Sort submissions by review progress (most complete first) */
export function sortSubmissionsByProgress(
  submissions: Submission[]
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

/** Sort files with pending ones first */
export function sortFilesForReview(files: SubmissionFile[]): SubmissionFile[] {
  return [...files].sort((a, b) => {
    const aPending = a.reviewStatus === "pending" ? 0 : 1;
    const bPending = b.reviewStatus === "pending" ? 0 : 1;
    return aPending - bPending;
  });
}

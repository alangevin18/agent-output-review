import type { FileAction, FileReviewStatus } from "./review";

/** A single file within a submission */
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

/** A collection of files submitted for review */
export type Submission = {
  id: string;
  title: string;
  description: string;
  author: string;
  createdAt: string;
  files: SubmissionFile[];
};

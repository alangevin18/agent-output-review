import type { FileReviewStatus } from "./review";

/** Stored in MongoDB: review state for a submission */
export type SubmissionReview = {
  submissionId: string;
  fileDecisions: Record<string, FileReviewStatus>;
  finalized: boolean;
  finalizedAt?: string;
};

/** Stored in MongoDB: a comment on a file */
export type Comment = {
  id: string;
  submissionId: string;
  fileId: string;
  text: string;
  author: string;
  parentCommentId?: string;
  isRejectionReason?: boolean;
  createdAt: string;
  replies?: Comment[];
};

/** Stored in MongoDB: activity log entry for finalized submissions */
export type ActivityEntry = {
  id: string;
  submissionId: string;
  title: string;
  finalizedAt: string;
  approvedFileIds: string[];
  rejectedFileIds: string[];
};

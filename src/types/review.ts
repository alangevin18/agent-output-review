/** Describes what action is being proposed for a file */
export type FileAction = "created" | "updated" | "deleted";

/** Current review status of a file */
export type FileReviewStatus = "pending" | "approved" | "rejected";
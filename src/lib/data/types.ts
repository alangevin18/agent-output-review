export type FileAction = "created" | "updated" | "deleted";

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
};

export type Submission = {
  id: string;
  title: string;
  description: string;
  author: string;
  createdAt: string;
  files: SubmissionFile[];
};

import { readFile } from "node:fs/promises";
import { SEED_MANIFEST } from "./paths";
import type { FileAction, Submission, SubmissionFile } from "./types";

type SeedFile = {
  id: string;
  filename: string;
  path?: string;
  target_path: string;
  mime_type?: string;
  size?: number;
  action: FileAction;
  message: string;
};

type SeedSubmission = {
  id: string;
  title: string;
  description: string;
  author: string;
  created_at: string;
  files: SeedFile[];
};

type SeedManifest = {
  submissions: SeedSubmission[];
};

function isFileAction(value: unknown): value is FileAction {
  return value === "created" || value === "updated" || value === "deleted";
}

function mapFile(file: SeedFile): SubmissionFile {
  if (!isFileAction(file.action)) {
    throw new Error(`Unknown file action on ${file.id}: ${String(file.action)}`);
  }

  return {
    id: file.id,
    filename: file.filename,
    seedPath: file.path ?? null,
    targetPath: file.target_path,
    mimeType: file.mime_type ?? null,
    size: file.size ?? null,
    action: file.action,
    message: file.message,
  };
}

function mapSubmission(submission: SeedSubmission): Submission {
  return {
    id: submission.id,
    title: submission.title,
    description: submission.description,
    author: submission.author,
    createdAt: submission.created_at,
    files: submission.files.map(mapFile),
  };
}

export async function listSubmissions(): Promise<Submission[]> {
  const raw = await readFile(SEED_MANIFEST, "utf8");
  const manifest = JSON.parse(raw) as SeedManifest;

  if (!Array.isArray(manifest.submissions)) {
    throw new Error("Seed manifest is missing a submissions array");
  }

  return manifest.submissions.map(mapSubmission);
}

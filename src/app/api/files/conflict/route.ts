import { NextRequest, NextResponse } from "next/server";
import { stat } from "fs/promises";
import path from "path";

const PROJECT_FILES_DIR = path.join(process.cwd(), "data/seed/project-files");

export type ConflictStatus = {
  hasConflict: boolean;
  type: "none" | "modified" | "already_exists" | "deleted";
  message?: string;
  fileExists: boolean;
  fileMtime?: string;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetPath = searchParams.get("targetPath");
  const action = searchParams.get("action");
  const submissionCreatedAt = searchParams.get("submissionCreatedAt");

  if (!targetPath || !action || !submissionCreatedAt) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const filePath = path.join(PROJECT_FILES_DIR, targetPath);
  const submissionDate = new Date(submissionCreatedAt);

  try {
    const stats = await stat(filePath);
    const fileMtime = stats.mtime;

    // File exists
    if (action === "created") {
      // Submission wants to create, but file already exists
      return NextResponse.json<ConflictStatus>({
        hasConflict: true,
        type: "already_exists",
        message: "This file already exists. Another submission may have created it first. Showing diff against existing file.",
        fileExists: true,
        fileMtime: fileMtime.toISOString(),
      });
    }

    if (action === "updated" || action === "deleted") {
      // Check if file was modified after submission was created
      if (fileMtime > submissionDate) {
        return NextResponse.json<ConflictStatus>({
          hasConflict: true,
          type: "modified",
          message: "This file was modified since this submission was created. Diff shows changes against the current version.",
          fileExists: true,
          fileMtime: fileMtime.toISOString(),
        });
      }
    }

    // No conflict
    return NextResponse.json<ConflictStatus>({
      hasConflict: false,
      type: "none",
      fileExists: true,
      fileMtime: fileMtime.toISOString(),
    });
  } catch (error) {
    // File doesn't exist
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      if (action === "updated") {
        return NextResponse.json<ConflictStatus>({
          hasConflict: true,
          type: "deleted",
          message:
            "This file has been deleted. If you approve, it will be added back in the state you see here.",
          fileExists: false,
        });
      }

      if (action === "deleted") {
        return NextResponse.json<ConflictStatus>({
          hasConflict: true,
          type: "deleted",
          message:
            "This file is already deleted. Nothing left to review — auto-approved.",
          fileExists: false,
        });
      }

      // action === "created" and file doesn't exist — expected, no conflict
      return NextResponse.json<ConflictStatus>({
        hasConflict: false,
        type: "none",
        fileExists: false,
      });
    }

    return NextResponse.json(
      { error: "Failed to check file status" },
      { status: 500 }
    );
  }
}

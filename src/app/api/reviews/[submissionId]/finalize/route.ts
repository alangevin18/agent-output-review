import { NextRequest, NextResponse } from "next/server";
import { mkdir, copyFile, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { connectDB, Review, Activity } from "@/lib/db";
import { getSubmission } from "@/lib/data/submissions";
import { SEED_DIR, PROJECT_FILES_DIR } from "@/lib/data/paths";

// POST /api/reviews/[submissionId]/finalize - Finalize a submission
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;

  try {
    const body = await request.json();
    const { title } = body as { title: string };

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get the current review state
    const review = await Review.findOne({ submissionId });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    if (review.finalized) {
      return NextResponse.json(
        { error: "Review already finalized" },
        { status: 400 }
      );
    }

    // Check if all files have been reviewed (no pending)
    const decisions = Object.fromEntries(review.fileDecisions);
    const hasPending = Object.values(decisions).some((d) => d === "pending");

    if (hasPending) {
      return NextResponse.json(
        { error: "Cannot finalize: some files are still pending review" },
        { status: 400 }
      );
    }

    // Get submission from manifest to get file details
    const submission = await getSubmission(submissionId);
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found in manifest" },
        { status: 404 }
      );
    }

    // Separate approved and rejected files
    const approvedFileIds = Object.entries(decisions)
      .filter(([, status]) => status === "approved")
      .map(([fileId]) => fileId);
    const rejectedFileIds = Object.entries(decisions)
      .filter(([, status]) => status === "rejected")
      .map(([fileId]) => fileId);

    // Apply approved changes to project-files/
    const mergeResults: { fileId: string; action: string; success: boolean; error?: string }[] = [];

    for (const fileId of approvedFileIds) {
      const file = submission.files.find((f) => f.id === fileId);
      if (!file) continue;

      const targetPath = join(PROJECT_FILES_DIR, file.targetPath);

      try {
        if (file.action === "created" || file.action === "updated") {
          // Copy from submissions to project-files
          if (!file.seedPath) {
            mergeResults.push({ fileId, action: file.action, success: false, error: "No source path" });
            continue;
          }
          const sourcePath = join(SEED_DIR, file.seedPath);

          console.log(`[Finalize] Copying ${file.action} file:`, {
            fileId,
            sourcePath,
            targetPath,
          });

          // Ensure target directory exists
          await mkdir(dirname(targetPath), { recursive: true });

          // Copy the file (works even if target doesn't exist)
          await copyFile(sourcePath, targetPath);
          mergeResults.push({ fileId, action: file.action, success: true });
          console.log(`[Finalize] Successfully copied ${fileId}`);

        } else if (file.action === "deleted") {
          // Delete from project-files
          console.log(`[Finalize] Deleting file:`, { fileId, targetPath });
          await unlink(targetPath);
          mergeResults.push({ fileId, action: file.action, success: true });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        mergeResults.push({ fileId, action: file.action, success: false, error: errorMsg });
        console.error(`[Finalize] Failed to merge file ${fileId}:`, error);
      }
    }

    const now = new Date();

    // Update review as finalized
    await Review.updateOne(
      { submissionId },
      { $set: { finalized: true, finalizedAt: now } }
    );

    // Create activity record
    const activity = await Activity.create({
      submissionId,
      title,
      finalizedAt: now,
      approvedFileIds,
      rejectedFileIds,
    });

    return NextResponse.json({
      success: true,
      mergeResults,
      activity: {
        id: activity._id.toString(),
        submissionId: activity.submissionId,
        title: activity.title,
        finalizedAt: activity.finalizedAt.toISOString(),
        approvedFileIds: activity.approvedFileIds,
        rejectedFileIds: activity.rejectedFileIds,
      },
    });
  } catch (error) {
    console.error("Error finalizing review:", error);
    return NextResponse.json(
      { error: "Failed to finalize review" },
      { status: 500 }
    );
  }
}

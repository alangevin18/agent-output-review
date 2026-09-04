import { NextRequest, NextResponse } from "next/server";
import { connectDB, Review, Activity } from "@/lib/db";

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

    // Separate approved and rejected files
    const approvedFileIds = Object.entries(decisions)
      .filter(([, status]) => status === "approved")
      .map(([fileId]) => fileId);
    const rejectedFileIds = Object.entries(decisions)
      .filter(([, status]) => status === "rejected")
      .map(([fileId]) => fileId);

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

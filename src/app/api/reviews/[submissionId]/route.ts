import { NextRequest, NextResponse } from "next/server";
import { connectDB, Review } from "@/lib/db";

// GET /api/reviews/[submissionId] - Get review state for a submission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;

  try {
    await connectDB();

    const review = await Review.findOne({ submissionId });

    if (!review) {
      // Return empty state if no review exists yet
      return NextResponse.json({
        submissionId,
        fileDecisions: {},
        finalized: false,
      });
    }

    return NextResponse.json({
      submissionId: review.submissionId,
      fileDecisions: Object.fromEntries(review.fileDecisions),
      finalized: review.finalized,
      finalizedAt: review.finalizedAt,
    });
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    );
  }
}

// PUT /api/reviews/[submissionId] - Update file decision
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;

  try {
    const body = await request.json();
    const { fileId, status } = body as {
      fileId: string;
      status: "pending" | "approved" | "rejected";
    };

    if (!fileId || !status) {
      return NextResponse.json(
        { error: "fileId and status are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const review = await Review.findOneAndUpdate(
      { submissionId },
      {
        $set: { [`fileDecisions.${fileId}`]: status },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      submissionId: review.submissionId,
      fileDecisions: Object.fromEntries(review.fileDecisions),
      finalized: review.finalized,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

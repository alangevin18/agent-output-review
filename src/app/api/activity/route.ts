import { NextResponse } from "next/server";
import { connectDB, Activity } from "@/lib/db";

// GET /api/activity - Get all activity (finalized reviews)
export async function GET() {
  try {
    await connectDB();

    const activities = await Activity.find()
      .sort({ finalizedAt: -1 })
      .lean();

    return NextResponse.json(
      activities.map((a) => ({
        id: a._id.toString(),
        submissionId: a.submissionId,
        title: a.title,
        finalizedAt: a.finalizedAt.toISOString(),
        approvedFileIds: a.approvedFileIds,
        rejectedFileIds: a.rejectedFileIds,
      }))
    );
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}

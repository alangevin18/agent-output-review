import { NextRequest, NextResponse } from "next/server";
import { connectDB, Comment } from "@/lib/db";

type RouteParams = {
  params: Promise<{ submissionId: string; fileId: string }>;
};

// GET /api/comments/[submissionId]/[fileId] - Get comments for a file
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { submissionId, fileId } = await params;

  try {
    await connectDB();

    const comments = await Comment.find({ submissionId, fileId })
      .sort({ createdAt: 1 })
      .lean();

    // Transform to nested structure for replies
    const topLevel = comments.filter((c) => !c.parentCommentId);
    const replies = comments.filter((c) => c.parentCommentId);

    const result = topLevel.map((comment) => ({
      id: comment._id.toString(),
      text: comment.body,
      author: comment.author,
      createdAt: comment.createdAt.toISOString(),
      isRejectionReason: comment.isRejectionReason,
      replies: replies
        .filter((r) => r.parentCommentId === comment._id.toString())
        .map((r) => ({
          id: r._id.toString(),
          text: r.body,
          author: r.author,
          createdAt: r.createdAt.toISOString(),
        })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/comments/[submissionId]/[fileId] - Add a comment
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { submissionId, fileId } = await params;

  try {
    const body = await request.json();
    const { text, parentCommentId, isRejectionReason } = body as {
      text: string;
      parentCommentId?: string;
      isRejectionReason?: boolean;
    };

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    await connectDB();

    const comment = await Comment.create({
      submissionId,
      fileId,
      body: text,
      author: "You",
      parentCommentId,
      isRejectionReason,
    });

    return NextResponse.json({
      id: comment._id.toString(),
      text: comment.body,
      author: comment.author,
      createdAt: comment.createdAt.toISOString(),
      isRejectionReason: comment.isRejectionReason,
      replies: [],
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

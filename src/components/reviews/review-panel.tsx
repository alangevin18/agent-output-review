"use client";

import { useState } from "react";
import { Check, MessageSquare, X } from "lucide-react";
import type { FileReviewStatus } from "@/types";

type Comment = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  replies: Comment[];
};

export function ReviewPanel({
  initialStatus,
  initialComments = [],
  onStatusChange,
}: {
  initialStatus: FileReviewStatus;
  initialComments?: Comment[];
  onStatusChange?: (status: FileReviewStatus, reason?: string) => void;
}) {
  const [status, setStatus] = useState<FileReviewStatus>(initialStatus);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const isPending = status === "pending";
  const isDecided = status !== "pending";

  const handleApprove = () => {
    setStatus("approved");
    setShowRejectInput(false);
    setRejectionReason("");
    onStatusChange?.("approved");
  };

  const handleReject = () => {
    if (showRejectInput && rejectionReason.trim()) {
      setStatus("rejected");
      onStatusChange?.("rejected", rejectionReason);
      setShowRejectInput(false);
    } else {
      setShowRejectInput(true);
    }
  };

  const handleChangeDecision = () => {
    setStatus("pending");
    setRejectionReason("");
    onStatusChange?.("pending");
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: `c${Date.now()}`,
      text: newComment,
      author: "You",
      createdAt: new Date().toISOString(),
      replies: [],
    };
    setComments([...comments, comment]);
    setNewComment("");
  };

  const handleAddReply = (parentId: string) => {
    if (!replyText.trim()) return;
    const reply: Comment = {
      id: `r${Date.now()}`,
      text: replyText,
      author: "You",
      createdAt: new Date().toISOString(),
      replies: [],
    };
    setComments(
      comments.map((c) =>
        c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c
      )
    );
    setReplyText("");
    setReplyingTo(null);
  };

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-black bg-sidebar">
      {/* Header */}
      <div className="shrink-0 border-b border-black px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Review
        </p>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Status section */}
        <div className="border-b border-black/10 px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">Status</p>
          <div className="mt-1.5 flex items-center gap-2">
            {status === "approved" && (
              <>
                <span className="flex items-center gap-1.5 rounded-full bg-primary/40 px-2.5 py-1 text-xs font-medium">
                  <Check className="size-3" strokeWidth={2} />
                  Approved
                </span>
                <button
                  type="button"
                  onClick={handleChangeDecision}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Change decision
                </button>
              </>
            )}
            {status === "rejected" && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                    <X className="size-3" strokeWidth={2} />
                    Rejected
                  </span>
                  <button
                    type="button"
                    onClick={handleChangeDecision}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Change decision
                  </button>
                </div>
                {rejectionReason && (
                  <p className="text-xs text-muted-foreground">
                    Reason: {rejectionReason}
                  </p>
                )}
              </div>
            )}
            {status === "pending" && (
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Pending Review
              </span>
            )}
          </div>
        </div>

        {/* Comments section */}
        <div className="px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">
            Comments {comments.length > 0 && `(${comments.length})`}
          </p>
          <div className="mt-2 space-y-3">
            {comments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="rounded-md bg-background p-2">
                    <p className="text-xs font-medium">{comment.author}</p>
                    <p className="mt-0.5 text-sm">{comment.text}</p>
                    <button
                      type="button"
                      onClick={() =>
                        setReplyingTo(
                          replyingTo === comment.id ? null : comment.id
                        )
                      }
                      className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <MessageSquare className="size-3" />
                      Reply
                    </button>
                  </div>
                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="ml-3 space-y-2 border-l-2 border-black/10 pl-3">
                      {comment.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="rounded-md bg-background p-2"
                        >
                          <p className="text-xs font-medium">{reply.author}</p>
                          <p className="mt-0.5 text-sm">{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Reply input */}
                  {replyingTo === comment.id && (
                    <div className="ml-3 flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAddReply(comment.id)
                        }
                        placeholder="Write a reply..."
                        className="min-w-0 flex-1 rounded border border-black/20 bg-background px-2 py-1 text-sm focus:border-black focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddReply(comment.id)}
                        className="shrink-0 rounded bg-foreground px-2 py-1 text-xs text-background hover:bg-foreground/80"
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add comment */}
          <div className="mt-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="w-full resize-none rounded border border-black/20 bg-background px-2 py-1.5 text-sm focus:border-black focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="mt-1 rounded bg-foreground px-3 py-1 text-xs text-background hover:bg-foreground/80 disabled:opacity-50"
            >
              Add Comment
            </button>
          </div>
        </div>
      </div>

      {/* Action buttons - anchored to bottom */}
      {isPending && (
        <div className="shrink-0 border-t border-black bg-sidebar p-4">
          {showRejectInput ? (
            <div className="space-y-2">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection..."
                rows={3}
                className="w-full resize-none rounded border border-black/20 bg-background px-2 py-1.5 text-sm focus:border-black focus:outline-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectInput(false);
                    setRejectionReason("");
                  }}
                  className="flex-1 rounded border border-black/20 px-3 py-2 text-sm hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  className="flex-1 rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReject}
                className="flex-1 rounded border border-black/20 px-3 py-2 text-sm hover:bg-background"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="flex-1 rounded bg-primary px-3 py-2 text-sm font-medium hover:bg-primary/80"
              >
                Approve
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

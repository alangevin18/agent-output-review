"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { FileReviewStatus, Submission } from "@/types";
import type { SubmissionReview } from "@/types/db";

type SubmissionsContextType = {
  submissions: Submission[];
  updateFileStatus: (
    submissionId: string,
    fileId: string,
    status: FileReviewStatus
  ) => void;
  finalizeSubmission: (submissionId: string) => Promise<void>;
};

const SubmissionsContext = createContext<SubmissionsContextType | null>(null);

export function SubmissionsProvider({
  initialSubmissions,
  children,
}: {
  initialSubmissions: Submission[];
  children: ReactNode;
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions);

  // Fetch review states from DB on mount
  useEffect(() => {
    async function loadReviewStates() {
      const updatedSubmissions = await Promise.all(
        initialSubmissions.map(async (submission) => {
          try {
            const res = await fetch(`/api/reviews/${submission.id}`);
            if (!res.ok) return submission;
            const review: SubmissionReview = await res.json();

            // Merge DB decisions with submission files
            return {
              ...submission,
              files: submission.files.map((file) => ({
                ...file,
                reviewStatus:
                  (review.fileDecisions[file.id] as FileReviewStatus) ||
                  file.reviewStatus,
              })),
            };
          } catch {
            return submission;
          }
        })
      );
      setSubmissions(updatedSubmissions);
    }
    loadReviewStates();
  }, [initialSubmissions]);

  const updateFileStatus = useCallback(
    async (submissionId: string, fileId: string, status: FileReviewStatus) => {
      // Optimistic update
      setSubmissions((prev) =>
        prev.map((submission) => {
          if (submission.id !== submissionId) return submission;
          return {
            ...submission,
            files: submission.files.map((file) => {
              if (file.id !== fileId) return file;
              return { ...file, reviewStatus: status };
            }),
          };
        })
      );

      // Persist to DB
      try {
        await fetch(`/api/reviews/${submissionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId, status }),
        });
      } catch (error) {
        console.error("Failed to persist file status:", error);
      }
    },
    []
  );

  const finalizeSubmission = useCallback(
    async (submissionId: string) => {
      const submission = submissions.find((s) => s.id === submissionId);
      if (!submission) return;

      try {
        const res = await fetch(`/api/reviews/${submissionId}/finalize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: submission.title }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to finalize");
        }

        // Could remove from submissions list or mark as finalized
        // For now, just log success
        console.log("Submission finalized successfully");
      } catch (error) {
        console.error("Failed to finalize submission:", error);
        throw error;
      }
    },
    [submissions]
  );

  return (
    <SubmissionsContext.Provider
      value={{ submissions, updateFileStatus, finalizeSubmission }}
    >
      {children}
    </SubmissionsContext.Provider>
  );
}

export function useSubmissions() {
  const context = useContext(SubmissionsContext);
  if (!context) {
    throw new Error("useSubmissions must be used within SubmissionsProvider");
  }
  return context;
}

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
import type { SubmissionReview, ActivityEntry } from "@/types/db";

type SubmissionsContextType = {
  submissions: Submission[];
  finalizedIds: Set<string>;
  activity: ActivityEntry[];
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
  const [finalizedIds, setFinalizedIds] = useState<Set<string>>(new Set());
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  // Fetch review states and activity from DB on mount
  useEffect(() => {
    async function loadData() {
      // Load activity
      try {
        const activityRes = await fetch("/api/activity");
        if (activityRes.ok) {
          const activityData: ActivityEntry[] = await activityRes.json();
          setActivity(activityData);
          // Mark finalized submissions
          setFinalizedIds(new Set(activityData.map((a) => a.submissionId)));
        }
      } catch (error) {
        console.error("Failed to load activity:", error);
      }

      // Load review states
      const updatedSubmissions = await Promise.all(
        initialSubmissions.map(async (submission) => {
          try {
            const res = await fetch(`/api/reviews/${submission.id}`);
            if (!res.ok) return submission;
            const review: SubmissionReview = await res.json();

            // If finalized, add to finalized set
            if (review.finalized) {
              setFinalizedIds((prev) => new Set([...prev, submission.id]));
            }

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
    loadData();
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

      const res = await fetch(`/api/reviews/${submissionId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: submission.title }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to finalize");
      }

      const data = await res.json();

      // Add to finalized set and activity
      setFinalizedIds((prev) => new Set([...prev, submissionId]));
      setActivity((prev) => [data.activity, ...prev]);
    },
    [submissions]
  );

  return (
    <SubmissionsContext.Provider
      value={{ submissions, finalizedIds, activity, updateFileStatus, finalizeSubmission }}
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

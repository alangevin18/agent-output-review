"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { FileReviewStatus, Submission } from "@/types";

type SubmissionsContextType = {
  submissions: Submission[];
  updateFileStatus: (
    submissionId: string,
    fileId: string,
    status: FileReviewStatus
  ) => void;
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

  const updateFileStatus = (
    submissionId: string,
    fileId: string,
    status: FileReviewStatus
  ) => {
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
  };

  return (
    <SubmissionsContext.Provider value={{ submissions, updateFileStatus }}>
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

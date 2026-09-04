"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { FileEntry } from "@/app/api/drive/route";

type DriveContextType = {
  files: FileEntry[];
  loading: boolean;
  refreshDrive: () => Promise<void>;
};

const DriveContext = createContext<DriveContextType | null>(null);

export function DriveProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshDrive = useCallback(async () => {
    try {
      const res = await fetch(`/api/drive?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load drive");
      const data: FileEntry[] = await res.json();
      setFiles(data);
    } catch (error) {
      console.error("Failed to load drive:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDrive();
  }, [refreshDrive]);

  return (
    <DriveContext.Provider value={{ files, loading, refreshDrive }}>
      {children}
    </DriveContext.Provider>
  );
}

export function useDrive() {
  const context = useContext(DriveContext);
  if (!context) {
    throw new Error("useDrive must be used within DriveProvider");
  }
  return context;
}

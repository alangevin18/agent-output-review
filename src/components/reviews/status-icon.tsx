import { Check, Circle, X } from "lucide-react";
import type { FileReviewStatus } from "@/lib/data/types";

export function StatusIcon({
  status,
  className = "size-3 shrink-0",
}: {
  status: FileReviewStatus;
  className?: string;
}) {
  if (status === "approved") {
    return <Check className={`${className} text-green-600`} strokeWidth={2} />;
  }
  if (status === "rejected") {
    return <X className={`${className} text-red-500`} strokeWidth={2} />;
  }
  return (
    <Circle className={`${className} text-muted-foreground`} strokeWidth={1.75} />
  );
}

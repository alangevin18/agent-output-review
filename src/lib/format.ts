import type { FileAction, FileReviewStatus } from "@/types";

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** UTC month + day so server HTML matches the client. */
export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${SHORT_MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return days === 1 ? "1 day ago" : `${days} days ago`;

  const months = Math.round(days / 30);
  if (months < 12) return months === 1 ? "1 month ago" : `${months} months ago`;

  const years = Math.round(days / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

export function actionLabel(action: FileAction): string {
  if (action === "created") return "Created";
  if (action === "updated") return "Updated";
  return "Deleted";
}

export function reviewStatusLabel(status: FileReviewStatus): string {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

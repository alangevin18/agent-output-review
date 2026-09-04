import { notFound } from "next/navigation";
import { FileReview } from "@/components/reviews/file-review";
import { getSubmission } from "@/lib/data/submissions";

export default async function FileReviewPage({
  params,
}: {
  params: Promise<{ submissionId: string; fileId: string }>;
}) {
  const { submissionId, fileId } = await params;
  const submission = await getSubmission(submissionId);
  const file = submission?.files.find((item) => item.id === fileId);

  if (!submission || !file) notFound();

  return <FileReview submissionId={submissionId} fileId={fileId} />;
}

import { notFound } from "next/navigation";
import { SubmissionOverview } from "@/components/reviews/submission-overview";
import { getSubmission } from "@/lib/data/submissions";

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const submission = await getSubmission(submissionId);

  if (!submission) notFound();

  return <SubmissionOverview submission={submission} />;
}

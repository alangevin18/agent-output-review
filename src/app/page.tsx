import { listSubmissions } from "@/lib/data/submissions";
import type { FileAction, Submission } from "@/lib/data/types";

function countByAction(submission: Submission, action: FileAction) {
  return submission.files.filter((file) => file.action === action).length;
}

export default async function Home() {
  const submissions = await listSubmissions();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 font-sans">
      <h1 className="text-2xl font-semibold tracking-tight">Submissions</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Loaded from <code>data/seed/manifest.json</code>
      </p>

      <ul className="mt-8 flex flex-col gap-4">
        {submissions.map((submission) => (
          <li
            key={submission.id}
            className="border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <h2 className="text-lg font-medium">{submission.title}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {submission.description}
            </p>
            <p className="mt-3 text-sm text-zinc-500">
              {submission.author} · {submission.createdAt} ·{" "}
              {submission.files.length} files · {countByAction(submission, "created")}{" "}
              created · {countByAction(submission, "updated")} updated ·{" "}
              {countByAction(submission, "deleted")} deleted
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}

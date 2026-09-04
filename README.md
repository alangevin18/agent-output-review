# Agent Output Review

This project implements a review workflow for AI-generated research artifacts. Reviewers can browse pending submissions, inspect individual files, compare proposed changes against the current trusted project state, leave threaded comments, approve or reject files, and finalize reviewed submissions into Project Files.

The core interaction model is intentionally similar to a pull request, but adapted for heterogeneous research artifacts such as images, CSVs, JSON, and Markdown rather than code diffs.

## How to Run

1. Install dependencies:

```bash
npm install
```

2. Configure MongoDB. Copy `.env.example` to `.env.local` and set your connection string:

```bash
cp .env.example .env.local
```

```
MONGODB_URI=mongodb+srv://.../phylo-takehome?retryWrites=true&w=majority
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

To reset review state and restore Project Files to the seed snapshot:

```bash
npx tsx scripts/reset-db.ts && git checkout -- data/seed/project-files/
```

## Key Design Decisions

### Per-file decisions drive submission status

Each file has one of three review states: pending, approved, or rejected.

A submission remains in review until every file has received a decision. Once all files have been reviewed, the submission becomes ready to finalize. If at least one file is approved, finalization merges those approved changes into Project Files. If every file is rejected, finalization closes the review without modifying Project Files.

I chose to derive submission state from file-level decisions rather than maintaining a separate independent submission status. This keeps the review lifecycle predictable and reflects the requirement that approval and rejection happen per file.

### Reviews are organized as submissions, then files

The Reviews sidebar shows pending submissions and their review progress. Expanding a submission exposes its individual files and their current review states.

Clicking a submission opens an overview showing overall progress and all proposed file changes. Clicking an individual file opens the detailed review experience for that artifact.

This keeps submission-level progress and file-level review within the same navigation model without introducing unnecessary additional pages.

### File review depends on both the action and the file type

The review experience first considers whether a file was created, updated, or deleted.

Created files show the proposed artifact.
Updated files show both the current trusted version and the proposed version.
Deleted files show the current trusted file and make it clear that approval will remove it.

The renderer then depends on the artifact type:

- PNG and JPG files are rendered visually.
- CSV files are rendered as tables.
- JSON files are syntax highlighted.
- Markdown files are rendered as documents.

Updated artifacts use comparison patterns appropriate to their type rather than forcing every file into a text-diff interface. This reflects one of the central challenges of the project: research artifacts require different review experiences depending on their format.

### Comments and review decisions are separate

Leaving a comment does not automatically affect the review state of a file. A reviewer can ask a question or leave feedback while the file remains pending.

Approving a file immediately marks it as approved.

Rejecting a file requires an explanation. The rejection reason is stored as a comment in the same discussion thread rather than being modeled separately. This keeps feedback organized in one place while satisfying the requirement that rejected files include an explanation.

### Finalization is a separate step from reviewing files

Completing the last file review does not automatically merge or close the submission.

Once every file has a decision, the submission moves into a ready-to-finalize state. The reviewer can then see the complete outcome of the review before committing it.

If approved files exist, finalization applies those changes to Project Files. Rejected files are ignored. If all files were rejected, finalization simply closes the submission without changing Project Files.

This gives the reviewer a final checkpoint before modifying the trusted project state.

### Project Files remain filesystem-backed

The provided `project-files/` directory is treated as the source of truth for the current trusted project state.

MongoDB stores only mutable application state such as review decisions, comments, finalization state, and activity history. File contents are not duplicated into the database.

When a submission is finalized:

- approved created files are copied into Project Files,
- approved updated files replace the current version,
- approved deleted files are removed from Project Files,
- rejected files leave Project Files unchanged.

This keeps the architecture simple while preserving a real merge operation on the local filesystem, as described in the project requirements.

### Conflict detection when submissions touch the same file

Because Project Files are the live source of truth, comparisons are always computed against the current filesystem state rather than a frozen snapshot from when the submission was created.

If another submission modifies the same file first, the next review adapts:

- If a file was updated by another submission, the reviewer sees a note and a live diff against the latest Project File.
- If a create targets a file that already exists, the review switches to a comparison view.
- If an update targets a file that was deleted, the proposed content is shown as a create, with a clear warning that approving will add it back.
- If a delete targets a file that is already gone, the change is auto-approved — there is nothing left to decide.

This keeps the reviewer oriented around the real current project state instead of stale base versions, while still surfacing conflicts that change the meaning of the proposed action.

### The interface follows Biomni's existing interaction patterns

The review system is designed to fit naturally into Biomni rather than feel like a separate application.

The project sidebar exposes Reviews, Drive, and Activity as project-level concepts. Reviews contains proposed agent work, Drive represents the current trusted Project Files, and Activity shows finalized submission history.

Individual file review uses the existing product pattern of a large primary workspace with a persistent contextual right sidebar. The artifact remains the focus of the page, while comments, review state, and approve/reject actions remain visible alongside it.

## AI Usage

I used Cursor throughout the implementation to accelerate development.

AI was most useful when the intended behavior was already clear. I used it to help scaffold components, implement repeated UI patterns, connect frontend state to backend APIs, generate database and API boilerplate, work with filesystem operations, and debug implementation issues.

I relied less on AI for the product model itself. I made the core interaction decisions around review state, finalization, file comparison behavior, navigation, comments, and how the feature should fit into Biomni's existing interface before using AI to implement them.

I also reviewed and adjusted generated code rather than treating generated output as authoritative, particularly around state transitions and merge behavior where implementation mistakes could result in inconsistent review state or incorrect changes to Project Files.

The main role of AI in this project was to reduce implementation time while I retained control over the product behavior, architecture, and review workflow.

## What I Would Improve With More Time

### Edge cases and conflict coverage

I would spend more time exploring additional edge cases around parallel submissions, unusual action sequences, and failure modes during finalization.

The current conflict detection covers the main create/update/delete overlaps against a changing Project Files directory, but a production system would benefit from more exhaustive scenario testing, clearer recovery paths when merges partially fail, and tighter guarantees that every concurrent path leaves review state and Project Files consistent.

### Anchored comments

I would extend comments beyond the file level so reviewers could attach feedback directly to specific content, such as a CSV row, JSON key, Markdown selection, or region of an image.

This would make feedback more precise and reduce ambiguity when reviewing complex artifacts. The project brief identifies this as a natural extension of the review model.

### Agent responses and revision loops

I would connect the review system back to the agent so reviewer feedback could trigger a revised artifact or a new version of the submission.

That would complete the human-agent loop described in the project: the agent produces work, the human reviews it, the agent responds to that feedback, and the process continues until the result is accepted.

### Additional research file formats

I would add purpose-built support for biology-specific formats such as FASTA, VCF, and BED rather than treating them as generic files.

The same principle used for the existing preview types would apply: each artifact should be presented in the format that makes review easiest rather than through a universal raw-text viewer.

### Better large-file review

For large CSVs and other large artifacts, I would add virtualization, filtering, search, and more targeted change detection.

The current implementation is intended to make review clear for the provided data, while a production system would need stronger tooling for very large research outputs.

### Richer activity history

I would extend the activity view with stronger search and filtering by date, submission, and affected file.

The current activity model records finalized submissions and their outcomes, which is enough to understand what was merged and when. A larger long-lived project would benefit from more powerful history navigation.

## Tradeoffs

I prioritized a coherent, polished end-to-end review workflow over implementing every possible artifact type or collaboration feature.

The implementation deliberately keeps Project Files filesystem-backed and uses MongoDB only for mutable review state and history. Submission status is derived from file decisions instead of introducing additional state that could become inconsistent. Comments remain file-level rather than adding anchored annotation infrastructure.

These choices kept the system small enough to reason about while preserving the core behavior of the product: AI-generated work is proposed, reviewed by a human, selectively accepted, and only then incorporated into the trusted project state.

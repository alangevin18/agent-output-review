# Agent Output Review

A review UI for agent-generated research files — like a pull request system, but for data files (plots, CSVs, configs, markdown). Humans review submissions before they're merged into trusted project files.

## Quick Start

```bash
npm install
npm run dev
```

- App: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3000/api/submissions](http://localhost:3000/api/submissions)

## Tech Stack

- **Next.js 16** (App Router) — React 19, TypeScript
- **Tailwind 4** — Styling
- **Node route handlers** — API endpoints in `src/app/api/`

## Project Structure

```
src/
  types/              # Type definitions (DB-ready)
    review.ts         # FileAction, FileReviewStatus
    submission.ts     # Submission, SubmissionFile
  lib/
    data/             # Data access (swap for DB later)
    utils/            # Business logic helpers
  components/
    shell/            # App layout, sidebar
    reviews/          # Review UI components
      previews/       # File type renderers
    ui/               # Shared UI components
  app/
    api/              # Backend endpoints
    reviews/          # Review pages

data/seed/            # Fixture data (see data/README.md)
```

## Key Design Decisions

### 1. File Preview System

**Decision:** Built dedicated preview components for each supported file type (PNG, JPG, CSV, JSON, MD) rather than using a generic viewer or iframe.

**Why:**
- Each file type has different optimal interactions (zoom for images, pagination for CSVs, syntax highlighting for JSON, rendered/source toggle for markdown)
- Better control over styling and UX consistency
- No external dependencies or security concerns from embedding arbitrary content
- Easy to extend with new file types

### 2. Client-Side State for Review Decisions

**Decision:** Review status changes are managed via React Context (`SubmissionsProvider`) that updates client-side state immediately.

**Why:**
- Instant feedback — sidebar icons and overview update without page reload
- Optimistic UI pattern ready for backend integration
- When DB is added, just add API calls in `updateFileStatus` and the UI stays the same
- Avoids prop drilling through deeply nested components

### 3. Types Separated from Logic

**Decision:** Types live in `src/types/`, utilities in `src/lib/utils/`, data access in `src/lib/data/`.

**Why:**
- Clean imports: `import type { Submission } from "@/types"`
- DB migration path is clear — only `src/lib/data/` changes
- Types can be shared with a future API client or mobile app
- Follows single-responsibility principle

### 4. Server Components with Client Islands

**Decision:** Pages are server components that pass IDs to client components. Client components look up current data from context.

**Why:**
- Initial page load is fast (server-rendered)
- Live updates work after hydration (context provides fresh state)
- Avoids hydration mismatches from dynamic data like timestamps
- Pattern scales well as app grows

### 5. Sidebar UX: Separate Click Targets

**Decision:** In the sidebar, the chevron expands/collapses and the title text navigates to overview.

**Why:**
- Matches user mental model (chevron = expand, text = go there)
- Prevents accidental navigation when just wanting to see file list
- Consistent with file explorer patterns users know

### 6. Simple Markdown Renderer

**Decision:** Built a basic regex-based markdown renderer instead of using a library like `react-markdown`.

**Why:**
- Agent output is predictable (headings, lists, tables, code blocks)
- No extra dependencies to audit or update
- Full control over styling to match app design
- ~60 lines of code vs adding a dependency tree
- Can easily extend for specific agent output patterns

## Future Considerations

- **Database:** Replace `src/lib/data/submissions.ts` with Prisma/Drizzle queries. Types stay the same.
- **Auth:** Add user context to track who reviewed what
- **Merge action:** Implement actual file copying when submission is approved
- **Diff view:** For "updated" files, show what changed
- **Comments persistence:** Currently in-memory; add to DB schema

## Data

Seed files live in `data/seed/` — development fixture data. The backend reads them from disk and does not write there. See `data/README.md` for schema details.

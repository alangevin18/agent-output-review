# Data

On-disk files the backend reads. This is not source code and not static assets — later merge will write here too.

```
data/
  seed/              Read-only fixture from the take-home. Never write here.
    manifest.json    Catalog of agent submissions
    project-files/   Initial "main branch" — already accepted files
    submissions/     Proposed file batches (the PRs)
```

`seed/` stays untouched so we can always reload the original example. When merge lands, live project files will live next to this (e.g. `data/workspace/`), copied from seed on first run.

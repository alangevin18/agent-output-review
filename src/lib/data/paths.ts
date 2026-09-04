import path from "node:path";

/** Immutable take-home fixture. The backend reads from here and never writes. */
export const SEED_DIR = path.join(process.cwd(), "data", "seed");
export const SEED_MANIFEST = path.join(SEED_DIR, "manifest.json");

/** Current/existing project files (the "main branch") */
export const PROJECT_FILES_DIR = path.join(SEED_DIR, "project-files");

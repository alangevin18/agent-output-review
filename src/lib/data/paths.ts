import path from "node:path";

/** Immutable take-home fixture. The backend reads from here and never writes. */
export const SEED_DIR = path.join(process.cwd(), "data", "seed");
export const SEED_MANIFEST = path.join(SEED_DIR, "manifest.json");

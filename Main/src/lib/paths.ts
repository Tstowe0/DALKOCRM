import path from "node:path";

export const ROOT_DIR = process.cwd();

/** Vercel/serverless: only /tmp is writable; use it for demo SQLite + uploads. */
const RUNTIME_ROOT =
  process.env.VERCEL === "1" ? path.join("/tmp", "dalko-crm") : ROOT_DIR;

export const DATA_DIR = path.join(RUNTIME_ROOT, "data");
export const DB_PATH = path.join(DATA_DIR, "mycrm.sqlite");
export const UPLOADS_DIR = path.join(RUNTIME_ROOT, "uploads");

/** Demo user for PoC Uploaded By / Salesperson */
export const DEMO_USER = {
  id: "user-demo-1",
  fullName: "DEMO SALESPERSON",
};
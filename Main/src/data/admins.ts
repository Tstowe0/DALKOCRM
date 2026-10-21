import { getDb } from "@/lib/db";
import { adminEmails as envAdminEmails } from "@/lib/admins";

export type AdminRow = {
  email: string;
  locked: boolean;
  addedBy: string;
  addedAt: string;
};

const ALLOWED_DOMAIN = "shipdalko.com";

function normalize(email: string) {
  return email.trim().toLowerCase();
}

function seedLockedAdmins() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      email TEXT PRIMARY KEY,
      locked INTEGER NOT NULL DEFAULT 0,
      added_by TEXT NOT NULL DEFAULT '',
      added_at TEXT NOT NULL
    )
  `);
  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT OR IGNORE INTO admins (email, locked, added_by, added_at)
     VALUES (?, 1, 'SYSTEM', ?)`
  );
  const lock = db.prepare(`UPDATE admins SET locked = 1 WHERE email = ?`);
  for (const email of envAdminEmails()) {
    insert.run(email, now);
    lock.run(email);
  }
}

export function listAdmins(): AdminRow[] {
  seedLockedAdmins();
  const rows = getDb()
    .prepare(
      `SELECT email, locked, added_by, added_at FROM admins ORDER BY email`
    )
    .all() as Array<{
    email: string;
    locked: number;
    added_by: string;
    added_at: string;
  }>;
  return rows.map((r) => ({
    email: r.email,
    locked: !!r.locked,
    addedBy: r.added_by,
    addedAt: r.added_at,
  }));
}

export function isStoredAdmin(email?: string | null): boolean {
  if (!email) return false;
  seedLockedAdmins();
  const row = getDb()
    .prepare(`SELECT email FROM admins WHERE email = ?`)
    .get(normalize(email)) as { email: string } | undefined;
  return !!row;
}

export function addAdmin(email: string, addedBy: string): AdminRow {
  const next = normalize(email);
  if (!next) throw new Error("Email is required");
  if (!next.endsWith(`@${ALLOWED_DOMAIN}`)) {
    throw new Error(`Admin must be a @${ALLOWED_DOMAIN} account`);
  }
  seedLockedAdmins();
  const existing = getDb()
    .prepare(`SELECT email FROM admins WHERE email = ?`)
    .get(next) as { email: string } | undefined;
  if (existing) throw new Error("That person is already an administrator");
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO admins (email, locked, added_by, added_at) VALUES (?, 0, ?, ?)`
    )
    .run(next, addedBy, now);
  return {
    email: next,
    locked: false,
    addedBy,
    addedAt: now,
  };
}

export function removeAdmin(email: string, actorEmail: string): void {
  const next = normalize(email);
  seedLockedAdmins();
  const row = getDb()
    .prepare(`SELECT email, locked FROM admins WHERE email = ?`)
    .get(next) as { email: string; locked: number } | undefined;
  if (!row) return;
  if (row.locked) throw new Error("This administrator cannot be removed");
  if (next === normalize(actorEmail)) {
    throw new Error("You cannot remove your own administrator access");
  }
  getDb().prepare(`DELETE FROM admins WHERE email = ?`).run(next);
}

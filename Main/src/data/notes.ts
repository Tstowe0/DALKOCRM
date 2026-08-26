import { getDb } from "@/lib/db";
import { newId } from "@/lib/ids";
import { DEMO_USER } from "@/lib/paths";
import { NOTE_CHAR_LIMIT } from "@/domain/leadExtras";

export { NOTE_CHAR_LIMIT };

export type Note = {
  id: string;
  companyId: string;
  body: string;
  createdBy: string;
  createdAt: string;
};

type Row = {
  id: string;
  company_id: string;
  body: string;
  created_by: string;
  created_at: string;
};

function map(row: Row): Note {
  return {
    id: row.id,
    companyId: row.company_id,
    body: row.body,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function listNotes(companyId: string): Note[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM notes WHERE company_id = ? ORDER BY created_at DESC`
    )
    .all(companyId) as Row[];
  return rows.map(map);
}

export function createNote(companyId: string, body: string): Note {
  const trimmed = body.trim().slice(0, NOTE_CHAR_LIMIT);
  if (!trimmed) throw new Error("Note is required");
  const now = new Date().toISOString();
  const id = newId("note");
  getDb()
    .prepare(
      `INSERT INTO notes (id, company_id, body, created_by, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(id, companyId, trimmed, DEMO_USER.fullName, now);
  return listNotes(companyId).find((n) => n.id === id)!;
}

export function deleteNote(id: string): void {
  getDb().prepare(`DELETE FROM notes WHERE id = ?`).run(id);
}

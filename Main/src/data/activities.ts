import { getDb } from "@/lib/db";
import { newId } from "@/lib/ids";
import { DEMO_USER } from "@/lib/paths";
import { ACTIVITY_TYPES, type ActivityType } from "@/domain/leadExtras";

export { ACTIVITY_TYPES, type ActivityType };

export type Activity = {
  id: string;
  companyId: string;
  type: string;
  dueDate: string;
  priority: string;
  purpose: string;
  status: string;
  activityOwner: string;
  createdAt: string;
  updatedAt: string;
};

type Row = {
  id: string;
  company_id: string;
  type: string;
  due_date: string;
  priority: string;
  purpose: string;
  status: string;
  activity_owner: string;
  created_at: string;
  updated_at: string;
};

function map(row: Row): Activity {
  return {
    id: row.id,
    companyId: row.company_id,
    type: row.type,
    dueDate: row.due_date,
    priority: row.priority,
    purpose: row.purpose,
    status: row.status,
    activityOwner: row.activity_owner,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listActivities(companyId: string): Activity[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM activities WHERE company_id = ?
       ORDER BY due_date DESC`
    )
    .all(companyId) as Row[];
  return rows.map(map);
}

export function getActivity(id: string): Activity | null {
  const row = getDb()
    .prepare(`SELECT * FROM activities WHERE id = ?`)
    .get(id) as Row | undefined;
  return row ? map(row) : null;
}

export function createActivity(
  companyId: string,
  input: {
    type: string;
    dueDate?: string;
    priority?: string;
    purpose?: string;
    status?: string;
    activityOwner?: string;
  }
): Activity {
  const now = new Date().toISOString();
  const id = newId("act");
  getDb()
    .prepare(
      `INSERT INTO activities (
        id, company_id, type, due_date, priority, purpose, status,
        activity_owner, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      companyId,
      input.type,
      input.dueDate ?? "",
      (input.priority ?? "").toUpperCase(),
      (input.purpose ?? "").toUpperCase(),
      (input.status ?? "OPEN").toUpperCase(),
      (input.activityOwner ?? DEMO_USER.fullName).toUpperCase(),
      now,
      now
    );
  return getActivity(id)!;
}

export function updateActivity(
  id: string,
  input: Partial<{
    type: string;
    dueDate: string;
    priority: string;
    purpose: string;
    status: string;
    activityOwner: string;
  }>
): Activity {
  const existing = getActivity(id);
  if (!existing) throw new Error("Activity not found");
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE activities SET
        type = ?, due_date = ?, priority = ?, purpose = ?, status = ?,
        activity_owner = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(
      input.type ?? existing.type,
      input.dueDate ?? existing.dueDate,
      (input.priority ?? existing.priority).toUpperCase(),
      (input.purpose ?? existing.purpose).toUpperCase(),
      (input.status ?? existing.status).toUpperCase(),
      (input.activityOwner ?? existing.activityOwner).toUpperCase(),
      now,
      id
    );
  return getActivity(id)!;
}

export function deleteActivity(id: string): void {
  getDb().prepare(`DELETE FROM activities WHERE id = ?`).run(id);
}

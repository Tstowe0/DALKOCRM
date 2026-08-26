import { getDb } from "@/lib/db";
import { newId } from "@/lib/ids";

export type ContactLog = {
  id: string;
  companyId: string;
  contactName: string;
  logType: string;
  purpose: string;
  subject: string;
  logDate: string;
  status: string;
  details: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
};

type Row = {
  id: string;
  company_id: string;
  contact_name: string;
  log_type: string;
  purpose: string;
  subject: string;
  log_date: string;
  status: string;
  details: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
};

function map(row: Row): ContactLog {
  return {
    id: row.id,
    companyId: row.company_id,
    contactName: row.contact_name,
    logType: row.log_type,
    purpose: row.purpose,
    subject: row.subject,
    logDate: row.log_date,
    status: row.status,
    details: row.details,
    startTime: row.start_time,
    endTime: row.end_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listContactLogs(companyId: string): ContactLog[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM contact_logs WHERE company_id = ?
       ORDER BY log_date DESC, created_at DESC`
    )
    .all(companyId) as Row[];
  return rows.map(map);
}

export function getContactLog(id: string): ContactLog | null {
  const row = getDb()
    .prepare(`SELECT * FROM contact_logs WHERE id = ?`)
    .get(id) as Row | undefined;
  return row ? map(row) : null;
}

export function createContactLog(
  companyId: string,
  input: {
    contactName: string;
    logType: string;
    purpose?: string;
    subject: string;
    logDate: string;
    status?: string;
    details?: string;
    startTime?: string;
    endTime?: string;
  }
): ContactLog {
  const now = new Date().toISOString();
  const id = newId("clog");
  getDb()
    .prepare(
      `INSERT INTO contact_logs (
        id, company_id, contact_name, log_type, purpose, subject, log_date,
        status, details, start_time, end_time, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      companyId,
      input.contactName.toUpperCase(),
      input.logType,
      (input.purpose ?? "").toUpperCase(),
      input.subject.toUpperCase().slice(0, 100),
      input.logDate,
      (input.status ?? "").toUpperCase(),
      input.details ?? "",
      input.startTime ?? "",
      input.endTime ?? "",
      now,
      now
    );
  return getContactLog(id)!;
}

export function updateContactLog(
  id: string,
  input: Partial<{
    contactName: string;
    logType: string;
    purpose: string;
    subject: string;
    logDate: string;
    status: string;
    details: string;
    startTime: string;
    endTime: string;
  }>
): ContactLog {
  const existing = getContactLog(id);
  if (!existing) throw new Error("Contact log not found");
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE contact_logs SET
        contact_name = ?, log_type = ?, purpose = ?, subject = ?, log_date = ?,
        status = ?, details = ?, start_time = ?, end_time = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(
      (input.contactName ?? existing.contactName).toUpperCase(),
      input.logType ?? existing.logType,
      (input.purpose ?? existing.purpose).toUpperCase(),
      (input.subject ?? existing.subject).toUpperCase().slice(0, 100),
      input.logDate ?? existing.logDate,
      (input.status ?? existing.status).toUpperCase(),
      input.details ?? existing.details,
      input.startTime ?? existing.startTime,
      input.endTime ?? existing.endTime,
      now,
      id
    );
  return getContactLog(id)!;
}

export function deleteContactLog(id: string): void {
  getDb().prepare(`DELETE FROM contact_logs WHERE id = ?`).run(id);
}

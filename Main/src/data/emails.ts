import { getDb } from "@/lib/db";
import { newId } from "@/lib/ids";
import { DEMO_USER } from "@/lib/paths";

export type LeadEmail = {
  id: string;
  companyId: string;
  subject: string;
  sentAt: string;
  toAddress: string;
  fromAddress: string;
  ccAddress: string;
  bccAddress: string;
  body: string;
  hasAttachment: boolean;
  storedName: string | null;
  fileName: string | null;
  createdAt: string;
};

type Row = {
  id: string;
  company_id: string;
  subject: string;
  sent_at: string;
  to_address: string;
  from_address: string;
  cc_address: string;
  bcc_address: string;
  body: string;
  has_attachment: number;
  stored_name: string | null;
  file_name: string | null;
  created_at: string;
};

function map(row: Row): LeadEmail {
  return {
    id: row.id,
    companyId: row.company_id,
    subject: row.subject,
    sentAt: row.sent_at,
    toAddress: row.to_address,
    fromAddress: row.from_address,
    ccAddress: row.cc_address,
    bccAddress: row.bcc_address,
    body: row.body,
    hasAttachment: !!row.has_attachment,
    storedName: row.stored_name,
    fileName: row.file_name,
    createdAt: row.created_at,
  };
}

export function listEmails(companyId: string): LeadEmail[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM emails WHERE company_id = ?
       ORDER BY sent_at DESC, to_address COLLATE NOCASE`
    )
    .all(companyId) as Row[];
  return rows.map(map);
}

export function getEmail(id: string): LeadEmail | null {
  const row = getDb().prepare(`SELECT * FROM emails WHERE id = ?`).get(id) as
    | Row
    | undefined;
  return row ? map(row) : null;
}

export function createComposedEmail(
  companyId: string,
  input: {
    subject: string;
    toAddress: string;
    fromAddress?: string;
    ccAddress?: string;
    bccAddress?: string;
    body?: string;
    hasAttachment?: boolean;
  }
): LeadEmail {
  const now = new Date().toISOString();
  const id = newId("em");
  getDb()
    .prepare(
      `INSERT INTO emails (
        id, company_id, subject, sent_at, to_address, from_address,
        cc_address, bcc_address, body, has_attachment, stored_name, file_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)`
    )
    .run(
      id,
      companyId,
      input.subject,
      now,
      input.toAddress,
      input.fromAddress ?? DEMO_USER.fullName.toLowerCase().replace(/\s+/g, ".") + "@dalko.local",
      input.ccAddress ?? "",
      input.bccAddress ?? "",
      input.body ?? "",
      input.hasAttachment ? 1 : 0,
      now
    );
  return getEmail(id)!;
}

export function createUploadedEmail(
  companyId: string,
  input: {
    fileName: string;
    storedName: string;
    subject?: string;
  }
): LeadEmail {
  const now = new Date().toISOString();
  const id = newId("em");
  getDb()
    .prepare(
      `INSERT INTO emails (
        id, company_id, subject, sent_at, to_address, from_address,
        cc_address, bcc_address, body, has_attachment, stored_name, file_name, created_at
      ) VALUES (?, ?, ?, ?, '', '', '', '', '', 1, ?, ?, ?)`
    )
    .run(
      id,
      companyId,
      input.subject ?? input.fileName,
      now,
      input.storedName,
      input.fileName,
      now
    );
  return getEmail(id)!;
}

export function deleteEmail(id: string): void {
  getDb().prepare(`DELETE FROM emails WHERE id = ?`).run(id);
}

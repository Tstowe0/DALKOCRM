import fs from "node:fs";
import path from "node:path";
import { getDb } from "@/lib/db";
import { newId } from "@/lib/ids";
import { UPLOADS_DIR } from "@/lib/paths";

export type Attachment = {
  id: string;
  companyId: string;
  fileName: string;
  storedName: string;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
};

type AttachmentRow = {
  id: string;
  company_id: string;
  file_name: string;
  stored_name: string;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
};

function mapRow(row: AttachmentRow): Attachment {
  return {
    id: row.id,
    companyId: row.company_id,
    fileName: row.file_name,
    storedName: row.stored_name,
    mimeType: row.mime_type,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
  };
}

export function listAttachments(companyId: string): Attachment[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM attachments WHERE company_id = ? ORDER BY uploaded_at DESC`
    )
    .all(companyId) as AttachmentRow[];
  return rows.map(mapRow);
}

export function getAttachment(id: string): Attachment | null {
  const row = getDb()
    .prepare(`SELECT * FROM attachments WHERE id = ?`)
    .get(id) as AttachmentRow | undefined;
  return row ? mapRow(row) : null;
}

export function absolutePathFor(attachment: Attachment): string {
  return path.join(UPLOADS_DIR, attachment.companyId, attachment.storedName);
}

export async function createAttachment(params: {
  companyId: string;
  fileName: string;
  mimeType: string;
  uploadedBy: string;
  bytes: Buffer;
}): Promise<Attachment> {
  const id = newId("att");
  const ext = path.extname(params.fileName);
  const storedName = `${id}${ext}`;
  const dir = path.join(UPLOADS_DIR, params.companyId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, storedName), params.bytes);

  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO attachments (
        id, company_id, file_name, stored_name, mime_type, uploaded_by, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      params.companyId,
      params.fileName,
      storedName,
      params.mimeType || "application/octet-stream",
      params.uploadedBy,
      now
    );

  return getAttachment(id)!;
}

export function renameAttachment(id: string, fileName: string): Attachment {
  const existing = getAttachment(id);
  if (!existing) throw new Error("Attachment not found");

  const ext = path.extname(existing.fileName);
  let base = fileName.trim();
  if (path.extname(base)) {
    base = base.slice(0, -path.extname(base).length);
  }
  if (!base) throw new Error("File name is required");
  const nextName = `${base}${ext}`;

  getDb()
    .prepare(`UPDATE attachments SET file_name = ? WHERE id = ?`)
    .run(nextName, id);
  return getAttachment(id)!;
}

export function deleteAttachment(id: string): void {
  const existing = getAttachment(id);
  if (!existing) return;
  const filePath = absolutePathFor(existing);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  getDb().prepare(`DELETE FROM attachments WHERE id = ?`).run(id);
}
import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";
import { newId } from "@/lib/ids";

export type ApiKeyRow = {
  id: string;
  label: string;
  last4: string;
  createdBy: string;
  createdAt: string;
};

type Row = {
  id: string;
  label: string;
  last4: string;
  created_by: string;
  created_at: string;
};

function map(row: Row): ApiKeyRow {
  return {
    id: row.id,
    label: row.label,
    last4: row.last4,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function listApiKeys(): ApiKeyRow[] {
  const rows = getDb()
    .prepare(
      `SELECT id, label, last4, created_by, created_at
       FROM api_keys ORDER BY created_at DESC`
    )
    .all() as Row[];
  return rows.map(map);
}

export function createApiKey(input: {
  label: string;
  secret?: string;
  createdBy: string;
}): { row: ApiKeyRow; secret: string } {
  const label = input.label.trim();
  if (!label) throw new Error("Name is required");
  const secret = (input.secret ?? "").trim() || `mycrm_${randomBytes(24).toString("hex")}`;
  const last4 = secret.slice(-4);
  const now = new Date().toISOString();
  const id = newId("key");
  getDb()
    .prepare(
      `INSERT INTO api_keys (id, label, last4, secret, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(id, label, last4, secret, input.createdBy, now);
  return {
    row: {
      id,
      label,
      last4,
      createdBy: input.createdBy,
      createdAt: now,
    },
    secret,
  };
}

export function deleteApiKey(id: string): void {
  getDb().prepare(`DELETE FROM api_keys WHERE id = ?`).run(id);
}

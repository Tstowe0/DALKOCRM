import { getDb } from "@/lib/db";
import { newId } from "@/lib/ids";
import { DEMO_USER } from "@/lib/paths";

export type Claim = {
  id: string;
  companyId: string;
  type: string;
  topic: string;
  loadNo: string;
  createdBy: string;
  createdAt: string;
  modifiedBy: string;
  modifiedAt: string;
};

export type ClaimListRow = Claim & {
  companyName: string;
  companyStatus: string;
};

type Row = {
  id: string;
  company_id: string;
  type: string;
  topic: string;
  load_no: string;
  created_by: string;
  created_at: string;
  modified_by: string;
  modified_at: string;
};

function map(row: Row): Claim {
  return {
    id: row.id,
    companyId: row.company_id,
    type: row.type,
    topic: row.topic,
    loadNo: row.load_no,
    createdBy: row.created_by,
    createdAt: row.created_at,
    modifiedBy: row.modified_by,
    modifiedAt: row.modified_at,
  };
}

export function listClaims(companyId: string): Claim[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM claims WHERE company_id = ?
       ORDER BY modified_at DESC, created_at DESC`
    )
    .all(companyId) as Row[];
  return rows.map(map);
}

/** Client section: most recent N claims */
export function listRecentClaims(companyId: string, limit = 5): Claim[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM claims WHERE company_id = ?
       ORDER BY modified_at DESC, created_at DESC
       LIMIT ?`
    )
    .all(companyId, limit) as Row[];
  return rows.map(map);
}

export function listAllClaimRows(): ClaimListRow[] {
  const rows = getDb()
    .prepare(
      `SELECT c.*,
              co.company_name AS company_name,
              co.status AS company_status
         FROM claims c
         JOIN companies co ON co.id = c.company_id
     ORDER BY c.modified_at DESC, c.created_at DESC`
    )
    .all() as Array<Row & { company_name: string; company_status: string }>;
  return rows.map((row) => ({
    ...map(row),
    companyName: row.company_name,
    companyStatus: row.company_status,
  }));
}

export function getClaim(id: string): Claim | null {
  const row = getDb().prepare(`SELECT * FROM claims WHERE id = ?`).get(id) as
    | Row
    | undefined;
  return row ? map(row) : null;
}

export function createClaim(
  companyId: string,
  input: { type: string; topic: string; loadNo?: string }
): Claim {
  const now = new Date().toISOString();
  const id = newId("clm");
  const by = DEMO_USER.fullName;
  getDb()
    .prepare(
      `INSERT INTO claims (
        id, company_id, type, topic, load_no,
        created_by, created_at, modified_by, modified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      companyId,
      input.type.trim(),
      input.topic.trim(),
      (input.loadNo ?? "").toUpperCase(),
      by,
      now,
      by,
      now
    );
  return getClaim(id)!;
}

export function updateClaim(
  id: string,
  input: {
    type: string;
    topic: string;
    loadNo?: string;
    companyId?: string;
  }
): Claim {
  const existing = getClaim(id);
  if (!existing) throw new Error("Claim not found");
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE claims SET
        company_id = ?, type = ?, topic = ?, load_no = ?,
        modified_by = ?, modified_at = ?
       WHERE id = ?`
    )
    .run(
      input.companyId ?? existing.companyId,
      input.type.trim(),
      input.topic.trim(),
      (input.loadNo ?? "").toUpperCase(),
      DEMO_USER.fullName,
      now,
      id
    );
  return getClaim(id)!;
}

export function deleteClaim(id: string): void {
  getDb().prepare(`DELETE FROM claims WHERE id = ?`).run(id);
}

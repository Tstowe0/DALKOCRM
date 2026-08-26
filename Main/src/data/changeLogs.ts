import { getDb } from "@/lib/db";
import { newId } from "@/lib/ids";
import { DEMO_USER } from "@/lib/paths";
import { formatLogDateTime } from "@/domain/formatting";

export { formatLogDateTime };

export type ChangeLog = {
  id: string;
  companyId: string;
  modification: string;
  modifiedBy: string;
  modifiedAt: string;
};

type Row = {
  id: string;
  company_id: string;
  modification: string;
  modified_by: string;
  modified_at: string;
};

function map(row: Row): ChangeLog {
  return {
    id: row.id,
    companyId: row.company_id,
    modification: row.modification,
    modifiedBy: row.modified_by,
    modifiedAt: row.modified_at,
  };
}

export function listChangeLogs(companyId: string): ChangeLog[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM change_logs WHERE company_id = ?
       ORDER BY modified_at DESC`
    )
    .all(companyId) as Row[];
  return rows.map(map);
}

export function addChangeLog(
  companyId: string,
  modification: string,
  modifiedBy = DEMO_USER.fullName
): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO change_logs (id, company_id, modification, modified_by, modified_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(newId("log"), companyId, modification, modifiedBy, now);
}

import { getDb } from "@/lib/db";
import { newId } from "@/lib/ids";

export type Campaign = {
  id: string;
  companyId: string;
  campaignName: string;
  templateName: string;
  createdAt: string;
};

type Row = {
  id: string;
  company_id: string;
  campaign_name: string;
  template_name: string;
  created_at: string;
};

function map(row: Row): Campaign {
  return {
    id: row.id,
    companyId: row.company_id,
    campaignName: row.campaign_name,
    templateName: row.template_name,
    createdAt: row.created_at,
  };
}

export function listCampaigns(companyId: string): Campaign[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM campaigns WHERE company_id = ?
       ORDER BY campaign_name COLLATE NOCASE`
    )
    .all(companyId) as Row[];
  return rows.map(map);
}

export type CampaignListRow = Campaign & {
  companyName: string;
  companyStatus: string;
};

export function listAllCampaignRows(): CampaignListRow[] {
  const rows = getDb()
    .prepare(
      `SELECT c.*,
              co.company_name AS company_name,
              co.status AS company_status
         FROM campaigns c
         JOIN companies co ON co.id = c.company_id
     ORDER BY c.campaign_name COLLATE NOCASE`
    )
    .all() as Array<
    Row & { company_name: string; company_status: string }
  >;
  return rows.map((row) => ({
    ...map(row),
    companyName: row.company_name,
    companyStatus: row.company_status,
  }));
}

export function getCampaign(id: string): Campaign | null {
  const row = getDb()
    .prepare(`SELECT * FROM campaigns WHERE id = ?`)
    .get(id) as Row | undefined;
  return row ? map(row) : null;
}

export function createCampaign(
  companyId: string,
  input: { campaignName: string; templateName?: string }
): Campaign {
  const now = new Date().toISOString();
  const id = newId("cmp");
  getDb()
    .prepare(
      `INSERT INTO campaigns (id, company_id, campaign_name, template_name, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      id,
      companyId,
      input.campaignName.toUpperCase(),
      (input.templateName ?? "").toUpperCase(),
      now
    );
  return getCampaign(id)!;
}

export function updateCampaign(
  id: string,
  input: {
    campaignName: string;
    templateName?: string;
    companyId?: string;
  }
): Campaign {
  const existing = getCampaign(id);
  if (!existing) throw new Error("Campaign not found");
  getDb()
    .prepare(
      `UPDATE campaigns SET
        company_id = ?, campaign_name = ?, template_name = ?
       WHERE id = ?`
    )
    .run(
      input.companyId ?? existing.companyId,
      input.campaignName.toUpperCase(),
      (input.templateName ?? "").toUpperCase(),
      id
    );
  return getCampaign(id)!;
}

export function deleteCampaign(id: string): void {
  getDb().prepare(`DELETE FROM campaigns WHERE id = ?`).run(id);
}

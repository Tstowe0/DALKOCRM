import { CampaignsBoard } from "@/components/campaigns/CampaignsBoard";
import { listAllCampaignRows } from "@/data/campaigns";
import { getDb } from "@/lib/db";
import {
  createGlobalCampaignAction,
  deleteGlobalCampaignAction,
  importCampaignsCsvAction,
  massDeleteCampaignsAction,
  updateGlobalCampaignAction,
} from "./actions";

export const dynamic = "force-dynamic";

function listCompanyOptions() {
  const rows = getDb()
    .prepare(
      `SELECT id, company_name FROM companies ORDER BY company_name COLLATE NOCASE`
    )
    .all() as Array<{ id: string; company_name: string }>;
  return rows.map((r) => ({
    id: r.id,
    companyName: r.company_name,
  }));
}

export default function CampaignsPage() {
  return (
    <CampaignsBoard
      initialRows={listAllCampaignRows()}
      companies={listCompanyOptions()}
      createAction={createGlobalCampaignAction}
      updateAction={updateGlobalCampaignAction}
      deleteAction={deleteGlobalCampaignAction}
      massDeleteAction={massDeleteCampaignsAction}
      importCsvAction={importCampaignsCsvAction}
    />
  );
}

import { ClaimsBoard } from "@/components/claims/ClaimsBoard";
import { listAllClaimRows } from "@/data/claims";
import { getDb } from "@/lib/db";
import {
  createGlobalClaimAction,
  deleteGlobalClaimAction,
  massDeleteClaimsAction,
  updateGlobalClaimAction,
} from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ companyId?: string }>;

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

export default async function ClaimsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const companyId = sp.companyId?.trim() || undefined;

  return (
    <ClaimsBoard
      initialRows={listAllClaimRows()}
      companies={listCompanyOptions()}
      initialCompanyId={companyId}
      createAction={createGlobalClaimAction}
      updateAction={updateGlobalClaimAction}
      deleteAction={deleteGlobalClaimAction}
      massDeleteAction={massDeleteClaimsAction}
    />
  );
}

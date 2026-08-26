import { ContactsBoard } from "@/components/contacts/ContactsBoard";
import { listAllContactRows, listContactOwners } from "@/data/contacts";
import { getDb } from "@/lib/db";
import { uploadAttachmentAction } from "@/app/leads/actions";
import {
  createGlobalContactAction,
  deleteGlobalContactAction,
  importContactsCsvAction,
  massDeleteContactsAction,
  updateGlobalContactAction,
} from "./actions";

export const dynamic = "force-dynamic";

function listCompanyOptions() {
  const rows = getDb()
    .prepare(
      `SELECT id, company_name, status FROM companies ORDER BY company_name COLLATE NOCASE`
    )
    .all() as Array<{ id: string; company_name: string; status: string }>;
  return rows.map((r) => ({
    id: r.id,
    companyName: r.company_name,
    status: r.status,
  }));
}

export default function ContactsPage() {
  const rows = listAllContactRows();
  const owners = listContactOwners();
  const companies = listCompanyOptions();

  return (
    <ContactsBoard
      initialRows={rows}
      owners={owners}
      companies={companies}
      createAction={createGlobalContactAction}
      updateAction={updateGlobalContactAction}
      deleteAction={deleteGlobalContactAction}
      massDeleteAction={massDeleteContactsAction}
      importCsvAction={importContactsCsvAction}
      uploadAttachmentAction={uploadAttachmentAction}
    />
  );
}

import { LeadsBoard } from "@/components/leads/LeadsBoard";
import { listClientRows, listSalespeople } from "@/data/companies";
import { uploadAttachmentAction } from "@/app/leads/actions";
import {
  deleteClientAction,
  importClientsCsvAction,
  massDeleteClientsAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default function ClientsPage() {
  const rows = listClientRows();
  const salespeople = listSalespeople();

  return (
    <LeadsBoard
      variant="client"
      initialRows={rows}
      salespeople={salespeople}
      importCsvAction={importClientsCsvAction}
      uploadAttachmentAction={uploadAttachmentAction}
      deleteAction={deleteClientAction}
      massDeleteAction={massDeleteClientsAction}
    />
  );
}

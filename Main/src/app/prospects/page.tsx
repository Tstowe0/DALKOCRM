import { LeadsBoard } from "@/components/leads/LeadsBoard";
import { listProspectRows, listSalespeople } from "@/data/companies";
import { uploadAttachmentAction } from "@/app/leads/actions";
import {
  convertProspectToClientAction,
  deleteProspectAction,
  importProspectsCsvAction,
  massConvertProspectsAction,
  massDeleteProspectsAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default function ProspectsPage() {
  const rows = listProspectRows();
  const salespeople = listSalespeople();

  return (
    <LeadsBoard
      variant="prospect"
      initialRows={rows}
      salespeople={salespeople}
      importCsvAction={importProspectsCsvAction}
      uploadAttachmentAction={uploadAttachmentAction}
      convertToClientAction={convertProspectToClientAction}
      deleteAction={deleteProspectAction}
      massDeleteAction={massDeleteProspectsAction}
      massConvertAction={massConvertProspectsAction}
    />
  );
}

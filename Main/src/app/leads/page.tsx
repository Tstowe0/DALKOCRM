import { LeadsBoard } from "@/components/leads/LeadsBoard";
import { listLeadRows, listSalespeople } from "@/data/companies";
import {
  convertLeadToClientAction,
  convertLeadToProspectAction,
  deleteLeadAction,
  importLeadsCsvAction,
  massConvertLeadsAction,
  massDeleteLeadsAction,
  uploadAttachmentAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default function LeadsPage() {
  const rows = listLeadRows();
  const salespeople = listSalespeople();

  return (
    <LeadsBoard
      variant="lead"
      initialRows={rows}
      salespeople={salespeople}
      importCsvAction={importLeadsCsvAction}
      uploadAttachmentAction={uploadAttachmentAction}
      convertToProspectAction={convertLeadToProspectAction}
      convertToClientAction={convertLeadToClientAction}
      deleteAction={deleteLeadAction}
      massDeleteAction={massDeleteLeadsAction}
      massConvertAction={massConvertLeadsAction}
    />
  );
}

import { LeadForm } from "@/components/lead-detail/LeadForm";
import { listParentAccounts } from "@/data/companies";
import { saveNewClientAction } from "../actions";

export const dynamic = "force-dynamic";

export default function NewClientPage() {
  const parents = listParentAccounts().map((p) => ({
    id: p.id,
    companyName: p.companyName,
  }));

  return (
    <LeadForm
      kind="client"
      mode="create"
      parents={parents}
      createAction={saveNewClientAction}
    />
  );
}

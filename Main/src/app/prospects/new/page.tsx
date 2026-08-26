import { LeadForm } from "@/components/lead-detail/LeadForm";
import { listParentAccounts } from "@/data/companies";
import { saveNewProspectAction } from "../actions";

export const dynamic = "force-dynamic";

export default function NewProspectPage() {
  const parents = listParentAccounts().map((p) => ({
    id: p.id,
    companyName: p.companyName,
  }));

  return (
    <LeadForm
      kind="prospect"
      mode="create"
      parents={parents}
      createAction={saveNewProspectAction}
    />
  );
}

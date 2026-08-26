import { LeadForm } from "@/components/lead-detail/LeadForm";
import { listParentAccounts } from "@/data/companies";
import { saveNewLeadAction } from "../actions";

export const dynamic = "force-dynamic";

export default function NewLeadPage() {
  const parents = listParentAccounts().map((p) => ({
    id: p.id,
    companyName: p.companyName,
  }));

  return (
    <LeadForm
      mode="create"
      parents={parents}
      createAction={saveNewLeadAction}
    />
  );
}
import { notFound, redirect } from "next/navigation";
import { LeadForm } from "@/components/lead-detail/LeadForm";
import {
  getCompany,
  listParentAccounts,
  listSubsidiaryRows,
} from "@/data/companies";
import { listContacts } from "@/data/contacts";
import { listAttachments } from "@/data/attachments";
import { listEmails } from "@/data/emails";
import { listActivities } from "@/data/activities";
import { listCampaigns } from "@/data/campaigns";
import { listRecentClaims } from "@/data/claims";
import { listContactLogs } from "@/data/contactLogs";
import { listNotes } from "@/data/notes";
import { listChangeLogs } from "@/data/changeLogs";
import { isClientStatus, isProspectStatus } from "@/domain/status";
import {
  addCampaignAction,
  addContactAction,
  addNoteAction,
  composeEmailAction,
  createActivityAction,
  createContactLogAction,
  deleteActivityAction,
  deleteAttachmentAction,
  deleteContactLogAction,
  deleteEmailAction,
  deleteNoteAction,
  removeCampaignAction,
  removeContactAction,
  renameAttachmentAction,
  updateActivityAction,
  updateContactAction,
  updateContactLogAction,
  uploadAttachmentAction,
  uploadEmailAction,
  uploadLogoAction,
} from "@/app/leads/actions";
import {
  addClaimForCompanyAction,
  removeClaimForCompanyAction,
  updateClaimForCompanyAction,
} from "@/app/claims/actions";
import {
  deleteClientAction,
  saveClientFieldAction,
  saveNewClientAction,
} from "../actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function ClientDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const company = getCompany(id);
  if (!company) notFound();
  if (!isClientStatus(company.status)) {
    if (isProspectStatus(company.status)) redirect(`/prospects/${id}`);
    redirect(`/leads/${id}`);
  }

  const contacts = listContacts(id);
  const attachments = listAttachments(id);
  const subsidiaries = listSubsidiaryRows(id);
  const emails = listEmails(id);
  const activities = listActivities(id);
  const campaigns = listCampaigns(id);
  const claims = listRecentClaims(id, 5);
  const contactLogs = listContactLogs(id);
  const notes = listNotes(id);
  const changeLogs = listChangeLogs(id);
  const parents = listParentAccounts().map((p) => ({
    id: p.id,
    companyName: p.companyName,
  }));

  return (
    <LeadForm
      kind="client"
      mode="edit"
      company={company}
      contacts={contacts}
      attachments={attachments}
      subsidiaries={subsidiaries}
      emails={emails}
      activities={activities}
      campaigns={campaigns}
      claims={claims}
      contactLogs={contactLogs}
      notes={notes}
      changeLogs={changeLogs}
      parents={parents}
      createAction={saveNewClientAction}
      onSaveField={saveClientFieldAction.bind(null, id)}
      addContactAction={addContactAction.bind(null, id)}
      updateContactAction={updateContactAction.bind(null, id)}
      removeContactAction={removeContactAction.bind(null, id)}
      uploadAttachmentAction={uploadAttachmentAction.bind(null, id)}
      renameAttachmentAction={renameAttachmentAction.bind(null, id)}
      deleteAttachmentAction={deleteAttachmentAction.bind(null, id)}
      uploadLogoAction={uploadLogoAction.bind(null, id)}
      deleteAction={deleteClientAction.bind(null, id)}
      composeEmailAction={composeEmailAction.bind(null, id)}
      uploadEmailAction={uploadEmailAction.bind(null, id)}
      deleteEmailAction={deleteEmailAction.bind(null, id)}
      createActivityAction={createActivityAction.bind(null, id)}
      updateActivityAction={updateActivityAction.bind(null, id)}
      deleteActivityAction={deleteActivityAction.bind(null, id)}
      addCampaignAction={addCampaignAction.bind(null, id)}
      removeCampaignAction={removeCampaignAction.bind(null, id)}
      addClaimAction={addClaimForCompanyAction.bind(null, id)}
      updateClaimAction={updateClaimForCompanyAction.bind(null, id)}
      removeClaimAction={removeClaimForCompanyAction.bind(null, id)}
      createContactLogAction={createContactLogAction.bind(null, id)}
      updateContactLogAction={updateContactLogAction.bind(null, id)}
      deleteContactLogAction={deleteContactLogAction.bind(null, id)}
      addNoteAction={addNoteAction.bind(null, id)}
      deleteNoteAction={deleteNoteAction.bind(null, id)}
    />
  );
}

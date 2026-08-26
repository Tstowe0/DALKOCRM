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
import { listContactLogs } from "@/data/contactLogs";
import { listNotes } from "@/data/notes";
import { listChangeLogs } from "@/data/changeLogs";
import { isLeadStatus, isProspectStatus } from "@/domain/status";
import {
  addContactAction,
  updateContactAction,
  deleteAttachmentAction,
  removeContactAction,
  renameAttachmentAction,
  saveLeadFieldAction,
  saveNewLeadAction,
  uploadAttachmentAction,
  uploadLogoAction,
  convertLeadToClientAction,
  convertLeadToProspectAction,
  deleteLeadAction,
  composeEmailAction,
  uploadEmailAction,
  deleteEmailAction,
  createActivityAction,
  updateActivityAction,
  deleteActivityAction,
  addCampaignAction,
  removeCampaignAction,
  createContactLogAction,
  updateContactLogAction,
  deleteContactLogAction,
  addNoteAction,
  deleteNoteAction,
} from "../actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function LeadDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const company = getCompany(id);
  if (!company) notFound();
  if (!isLeadStatus(company.status)) {
    if (isProspectStatus(company.status)) redirect(`/prospects/${id}`);
    if (company.status === "Client") redirect(`/clients/${id}`);
    notFound();
  }
  const contacts = listContacts(id);
  const attachments = listAttachments(id);
  const subsidiaries = listSubsidiaryRows(id);
  const emails = listEmails(id);
  const activities = listActivities(id);
  const campaigns = listCampaigns(id);
  const contactLogs = listContactLogs(id);
  const notes = listNotes(id);
  const changeLogs = listChangeLogs(id);
  const parents = listParentAccounts().map((p) => ({
    id: p.id,
    companyName: p.companyName,
  }));

  return (
    <LeadForm
      mode="edit"
      company={company}
      contacts={contacts}
      attachments={attachments}
      subsidiaries={subsidiaries}
      emails={emails}
      activities={activities}
      campaigns={campaigns}
      contactLogs={contactLogs}
      notes={notes}
      changeLogs={changeLogs}
      parents={parents}
      createAction={saveNewLeadAction}
      onSaveField={saveLeadFieldAction.bind(null, id)}
      addContactAction={addContactAction.bind(null, id)}
      updateContactAction={updateContactAction.bind(null, id)}
      removeContactAction={removeContactAction.bind(null, id)}
      uploadAttachmentAction={uploadAttachmentAction.bind(null, id)}
      renameAttachmentAction={renameAttachmentAction.bind(null, id)}
      deleteAttachmentAction={deleteAttachmentAction.bind(null, id)}
      uploadLogoAction={uploadLogoAction.bind(null, id)}
      convertToProspectAction={convertLeadToProspectAction.bind(null, id)}
      convertToClientAction={convertLeadToClientAction.bind(null, id)}
      deleteAction={deleteLeadAction.bind(null, id)}
      composeEmailAction={composeEmailAction.bind(null, id)}
      uploadEmailAction={uploadEmailAction.bind(null, id)}
      deleteEmailAction={deleteEmailAction.bind(null, id)}
      createActivityAction={createActivityAction.bind(null, id)}
      updateActivityAction={updateActivityAction.bind(null, id)}
      deleteActivityAction={deleteActivityAction.bind(null, id)}
      addCampaignAction={addCampaignAction.bind(null, id)}
      removeCampaignAction={removeCampaignAction.bind(null, id)}
      createContactLogAction={createContactLogAction.bind(null, id)}
      updateContactLogAction={updateContactLogAction.bind(null, id)}
      deleteContactLogAction={deleteContactLogAction.bind(null, id)}
      addNoteAction={addNoteAction.bind(null, id)}
      deleteNoteAction={deleteNoteAction.bind(null, id)}
    />
  );
}

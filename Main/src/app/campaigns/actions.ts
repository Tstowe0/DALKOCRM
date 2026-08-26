"use server";

import { revalidatePath } from "next/cache";
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  updateCampaign,
} from "@/data/campaigns";
import { getCompany } from "@/data/companies";
import { getDb } from "@/lib/db";
import { addChangeLog } from "@/data/changeLogs";

function revalidateCampaigns(companyId?: string) {
  revalidatePath("/campaigns");
  revalidatePath("/leads");
  revalidatePath("/prospects");
  revalidatePath("/clients");
  if (companyId) {
    revalidatePath(`/leads/${companyId}`);
    revalidatePath(`/prospects/${companyId}`);
    revalidatePath(`/clients/${companyId}`);
  }
}

function findCompanyIdByName(name: string): string | null {
  const row = getDb()
    .prepare(
      `SELECT id FROM companies WHERE upper(company_name) = upper(?) LIMIT 1`
    )
    .get(name.trim()) as { id: string } | undefined;
  return row?.id ?? null;
}

export async function createGlobalCampaignAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "").trim();
  const campaignName = String(formData.get("campaignName") ?? "").trim();
  if (!companyId) throw new Error("Company is required");
  if (!campaignName) throw new Error("Campaign Name is required");
  if (!getCompany(companyId)) throw new Error("Company not found");

  createCampaign(companyId, {
    campaignName,
    templateName: String(formData.get("templateName") ?? ""),
  });
  addChangeLog(companyId, `Campaign added: ${campaignName.toUpperCase()}`);
  revalidateCampaigns(companyId);
}

export async function updateGlobalCampaignAction(
  campaignId: string,
  formData: FormData
) {
  const existing = getCampaign(campaignId);
  if (!existing) throw new Error("Campaign not found");
  const companyId = String(
    formData.get("companyId") ?? existing.companyId
  ).trim();
  const campaignName = String(formData.get("campaignName") ?? "").trim();
  if (!companyId) throw new Error("Company is required");
  if (!campaignName) throw new Error("Campaign Name is required");
  if (!getCompany(companyId)) throw new Error("Company not found");

  updateCampaign(campaignId, {
    companyId,
    campaignName,
    templateName: String(formData.get("templateName") ?? ""),
  });
  addChangeLog(companyId, `Campaign updated: ${campaignName.toUpperCase()}`);
  revalidateCampaigns(companyId);
  if (companyId !== existing.companyId) {
    revalidateCampaigns(existing.companyId);
  }
}

export async function deleteGlobalCampaignAction(campaignId: string) {
  const existing = getCampaign(campaignId);
  if (!existing) return;
  deleteCampaign(campaignId);
  addChangeLog(existing.companyId, "Campaign removed");
  revalidateCampaigns(existing.companyId);
}

export async function massDeleteCampaignsAction(ids: string[]) {
  for (const id of ids) {
    const existing = getCampaign(id);
    if (!existing) continue;
    deleteCampaign(id);
    addChangeLog(existing.companyId, "Campaign removed");
  }
  revalidateCampaigns();
}

export async function importCampaignsCsvAction(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Select a CSV file to import");
  }
  const text = (await file.text()).replace(/^\uFEFF/, "");
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) throw new Error("CSV has no data rows");

  function splitCsv(line: string): string[] {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = !inQ;
      } else if (ch === "," && !inQ) {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out.map((c) => c.trim());
  }

  const headers = splitCsv(lines[0]).map((h) => h.toLowerCase());
  const idx = (name: string) => headers.indexOf(name.toLowerCase());

  let created = 0;
  for (const line of lines.slice(1)) {
    const cols = splitCsv(line);
    const get = (name: string) => {
      const i = idx(name);
      return i >= 0 ? cols[i] ?? "" : "";
    };
    const campaignName = get("campaign name") || get("campaign");
    const companyName = get("company") || get("company name");
    if (!campaignName.trim() || !companyName.trim()) continue;
    const companyId = findCompanyIdByName(companyName);
    if (!companyId) continue;
    createCampaign(companyId, {
      campaignName,
      templateName: get("template name") || get("template"),
    });
    created++;
  }

  revalidateCampaigns();
  return { created };
}

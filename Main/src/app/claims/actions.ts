"use server";

import { revalidatePath } from "next/cache";
import {
  createClaim,
  deleteClaim,
  getClaim,
  updateClaim,
} from "@/data/claims";
import { getCompany } from "@/data/companies";
import { addChangeLog } from "@/data/changeLogs";

function revalidateClaims(companyId?: string) {
  revalidatePath("/claims");
  revalidatePath("/clients");
  revalidatePath("/leads");
  revalidatePath("/prospects");
  if (companyId) {
    revalidatePath(`/clients/${companyId}`);
    revalidatePath(`/leads/${companyId}`);
    revalidatePath(`/prospects/${companyId}`);
  }
}

export async function createGlobalClaimAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim();
  if (!companyId) throw new Error("Company is required");
  if (!type) throw new Error("Type is required");
  if (!topic) throw new Error("Topic is required");
  if (!getCompany(companyId)) throw new Error("Company not found");

  createClaim(companyId, {
    type,
    topic,
    loadNo: String(formData.get("loadNo") ?? ""),
  });
  addChangeLog(companyId, `Claim added: ${type} / ${topic}`);
  revalidateClaims(companyId);
}

export async function updateGlobalClaimAction(
  claimId: string,
  formData: FormData
) {
  const existing = getClaim(claimId);
  if (!existing) throw new Error("Claim not found");
  const companyId = String(
    formData.get("companyId") ?? existing.companyId
  ).trim();
  const type = String(formData.get("type") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim();
  if (!companyId) throw new Error("Company is required");
  if (!type) throw new Error("Type is required");
  if (!topic) throw new Error("Topic is required");
  if (!getCompany(companyId)) throw new Error("Company not found");

  updateClaim(claimId, {
    companyId,
    type,
    topic,
    loadNo: String(formData.get("loadNo") ?? ""),
  });
  addChangeLog(companyId, `Claim updated: ${type} / ${topic}`);
  revalidateClaims(companyId);
  if (companyId !== existing.companyId) {
    revalidateClaims(existing.companyId);
  }
}

export async function deleteGlobalClaimAction(claimId: string) {
  const existing = getClaim(claimId);
  if (!existing) return;
  deleteClaim(claimId);
  addChangeLog(existing.companyId, "Claim deleted");
  revalidateClaims(existing.companyId);
}

export async function massDeleteClaimsAction(ids: string[]) {
  for (const id of ids) {
    const existing = getClaim(id);
    if (!existing) continue;
    deleteClaim(id);
    addChangeLog(existing.companyId, "Claim deleted");
  }
  revalidateClaims();
}

/** Bound for Client detail section */
export async function addClaimForCompanyAction(
  companyId: string,
  formData: FormData
) {
  formData.set("companyId", companyId);
  await createGlobalClaimAction(formData);
}

export async function updateClaimForCompanyAction(
  companyId: string,
  claimId: string,
  formData: FormData
) {
  formData.set("companyId", companyId);
  await updateGlobalClaimAction(claimId, formData);
}

export async function removeClaimForCompanyAction(
  companyId: string,
  claimId: string
) {
  const existing = getClaim(claimId);
  if (!existing || existing.companyId !== companyId) return;
  await deleteGlobalClaimAction(claimId);
}

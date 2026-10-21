"use server";

import { revalidatePath } from "next/cache";
import { createApiKey, deleteApiKey } from "@/data/apiKeys";
import { requireAdmin } from "@/lib/actor";

export async function createApiKeyAction(formData: FormData) {
  const actor = await requireAdmin();
  const label = String(formData.get("label") ?? "");
  const pasted = String(formData.get("secret") ?? "").trim();
  const created = createApiKey({
    label,
    secret: pasted || undefined,
    createdBy: actor.fullName,
  });
  revalidatePath("/settings");
  return { secret: created.secret, last4: created.row.last4 };
}

export async function deleteApiKeyAction(id: string) {
  await requireAdmin();
  deleteApiKey(id);
  revalidatePath("/settings");
}

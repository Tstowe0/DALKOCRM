"use server";

import { revalidatePath } from "next/cache";
import { addAdmin, removeAdmin } from "@/data/admins";
import { requireAdmin } from "@/lib/actor";

function revalidateAdminPages() {
  revalidatePath("/permissions");
  revalidatePath("/settings");
}

export async function addAdminAction(formData: FormData) {
  const actor = await requireAdmin();
  addAdmin(String(formData.get("email") ?? ""), actor.fullName);
  revalidateAdminPages();
}

export async function removeAdminAction(email: string) {
  const actor = await requireAdmin();
  removeAdmin(email, actor.email);
  revalidateAdminPages();
}

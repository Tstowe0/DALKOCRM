import { auth } from "@/auth";
import { addChangeLog } from "@/data/changeLogs";
import { isStoredAdmin } from "@/data/admins";
import { isAdminEmail } from "@/lib/admins";
import { DEMO_USER } from "@/lib/paths";

export type Actor = {
  id: string;
  fullName: string;
  displayName: string;
  email: string;
};

export async function getActor(): Promise<Actor> {
  const session = await auth();
  const displayName = session?.user?.name?.trim() || DEMO_USER.fullName;
  return {
    id: session?.user?.id || DEMO_USER.id,
    displayName,
    fullName: displayName.toUpperCase(),
    email: session?.user?.email?.trim() || "",
  };
}

export async function isAdmin(): Promise<boolean> {
  const actor = await getActor();
  return isAdminEmail(actor.email) || isStoredAdmin(actor.email);
}

export async function requireAdmin(): Promise<Actor> {
  const actor = await getActor();
  if (!isAdminEmail(actor.email) && !isStoredAdmin(actor.email)) {
    throw new Error("Settings is limited to administrators");
  }
  return actor;
}

export async function logChange(companyId: string, modification: string) {
  const actor = await getActor();
  addChangeLog(companyId, modification, actor.fullName);
}

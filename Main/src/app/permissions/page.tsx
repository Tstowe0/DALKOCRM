import { redirect } from "next/navigation";
import { PermissionsBoard } from "@/components/settings/PermissionsBoard";
import { listAdmins } from "@/data/admins";
import { isAdmin } from "@/lib/actor";
import { addAdminAction, removeAdminAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function PermissionsPage() {
  if (!(await isAdmin())) redirect("/leads");

  return (
    <PermissionsBoard
      admins={listAdmins()}
      addAdminAction={addAdminAction}
      removeAdminAction={removeAdminAction}
    />
  );
}

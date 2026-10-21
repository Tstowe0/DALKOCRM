import { redirect } from "next/navigation";
import { SettingsBoard } from "@/components/settings/SettingsBoard";
import { listApiKeys } from "@/data/apiKeys";
import { isAdmin } from "@/lib/actor";
import { createApiKeyAction, deleteApiKeyAction } from "./actions";

export const dynamic = "force-dynamic";

function tenantFromIssuer(issuer?: string) {
  const match = issuer?.match(/login\.microsoftonline\.com\/([^/]+)/i);
  return match?.[1] ?? "";
}

export default async function SettingsPage() {
  if (!(await isAdmin())) redirect("/leads");

  return (
    <SettingsBoard
      microsoft={{
        appName: "Dalko MyCRM",
        tenantId: tenantFromIssuer(process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER),
        clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID ?? "",
        secretConfigured: Boolean(process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET),
      }}
      apiKeys={listApiKeys()}
      createApiKeyAction={createApiKeyAction}
      deleteApiKeyAction={deleteApiKeyAction}
    />
  );
}

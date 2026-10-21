"use server";

import { signIn, signOut } from "@/auth";

function safeCallback(url?: string | null) {
  if (url && url.startsWith("/") && !url.startsWith("//")) return url;
  return "/dashboard";
}

export async function signInWithMicrosoft(callbackUrl?: string | null) {
  await signIn("microsoft-entra-id", { redirectTo: safeCallback(callbackUrl) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

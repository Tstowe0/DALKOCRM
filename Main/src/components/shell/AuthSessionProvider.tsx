"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { DialogProvider } from "@/components/shell/dialogs";

export function AuthSessionProvider({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return (
    <SessionProvider session={session}>
      <DialogProvider>{children}</DialogProvider>
    </SessionProvider>
  );
}

import type { Metadata } from "next";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/actor";
import { AuthSessionProvider } from "@/components/shell/AuthSessionProvider";
import { AppShell } from "@/components/shell/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyCRM",
  description: "DALKO MyCRM local proof of concept",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const admin = session?.user?.email ? await isAdmin() : false;
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">
        <AuthSessionProvider session={session}>
          <AppShell isAdmin={admin}>
            {children}
          </AppShell>
        </AuthSessionProvider>
      </body>
    </html>
  );
}

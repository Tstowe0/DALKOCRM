import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const ALLOWED_DOMAIN = "shipdalko.com";

function emailFrom(user?: { email?: string | null }, profile?: unknown) {
  const p = profile as
    | { email?: string; preferred_username?: string }
    | undefined;
  return (
    user?.email ||
    p?.email ||
    p?.preferred_username ||
    ""
  ).toLowerCase();
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
      authorization: {
        params: {
          scope: "openid profile email offline_access User.Read",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      return emailFrom(user, profile).endsWith(`@${ALLOWED_DOMAIN}`);
    },
    async jwt({ token, profile }) {
      const p = profile as { oid?: string } | undefined;
      if (p?.oid) token.oid = p.oid;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.oid ?? token.sub ?? "");
      }
      return session;
    },
  },
});

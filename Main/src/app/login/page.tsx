import Image from "next/image";
import { LoginCard } from "@/app/login/LoginCard";

export const metadata = {
  title: "Sign in · MyCRM",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const configured = Boolean(process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <header className="relative flex h-[70px] items-center bg-[var(--color-blue)] px-5 text-white">
        <div className="z-10 flex shrink-0 items-baseline leading-none">
          <span
            className="text-[26px] font-bold tracking-tight"
            style={{ fontFamily: "var(--font-brand-my)" }}
          >
            My
          </span>
          <span
            className="text-[20px] font-bold tracking-[0.04em] uppercase"
            style={{ fontFamily: "var(--font-brand-crm)" }}
          >
            CRM
          </span>
        </div>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Image
            src="/brand/Logo1-transparent.png"
            alt="DALKO Resources"
            width={260}
            height={64}
            className="h-[52px] w-auto object-contain"
            priority
          />
        </div>
      </header>
      <div
        className="h-2.5 shadow-[0_3px_5px_rgba(0,0,0,0.22)]"
        style={{
          background:
            "linear-gradient(180deg, var(--color-gold-light) 0%, var(--color-gold) 42%, var(--color-gold-deep) 100%)",
        }}
      />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <LoginCard
          callbackUrl={callbackUrl}
          error={error}
          configured={configured}
        />
      </main>
      <footer className="px-4 py-4 text-center text-xs text-[var(--color-blue)]/45">
        MyCRM · DALKO Resources
      </footer>
    </div>
  );
}

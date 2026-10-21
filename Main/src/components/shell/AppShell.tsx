"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { UserMenu } from "@/components/shell/UserMenu";

/** Primary link bar — Dashboard first; remaining labels/order from Appearance */
const PRIMARY_NAV: Array<{
  href: string;
  label: string;
  enabled: boolean;
}> = [
  { href: "/dashboard", label: "Dashboard", enabled: true },
  { href: "/leads", label: "Leads", enabled: true },
  { href: "/prospects", label: "Prospects", enabled: true },
  { href: "/clients", label: "Clients", enabled: true },
  { href: "/contacts", label: "Contacts", enabled: true },
  { href: "/campaigns", label: "Campaigns", enabled: true },
  { href: "/claims", label: "Claims", enabled: true },
];

export function TopBar() {
  return (
    <header className="relative flex h-[70px] items-center bg-[var(--color-blue)] px-5 text-white">
      {/* Spec wording: MyCRM — white, bold */}
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

      {/* Centered wordmark. Transparent PNG sits cleanly on the navy bar. */}
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

      {/* Spec: username not shown; hover text = user name. Mockup = white circle. */}
      <div className="z-10 ml-auto shrink-0">
        <UserMenu />
      </div>
    </header>
  );
}

const SITE_NAV = [
  { href: "/permissions", label: "Site Permissions" },
  { href: "/settings", label: "Site Settings" },
] as const;

export function NavBar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [siteOpen, setSiteOpen] = useState(false);
  const siteRef = useRef<HTMLDivElement>(null);
  const siteActive = SITE_NAV.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!siteRef.current?.contains(e.target as Node)) setSiteOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <nav
      className="relative flex h-11 items-stretch border-b border-black/25 px-4 text-[13px] text-[var(--color-blue)] shadow-[0_3px_5px_rgba(0,0,0,0.22)]"
      style={{
        fontFamily: "var(--font-heading)",
        background:
          "linear-gradient(180deg, var(--color-gold-light) 0%, var(--color-gold) 42%, var(--color-gold-deep) 100%)",
      }}
    >
      <div className="flex min-w-0 flex-1 items-stretch gap-1">
        {PRIMARY_NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const className = `flex items-center px-3.5 ${
            active
              ? "border-b-2 border-[var(--color-blue)] font-bold"
              : "border-b-2 border-transparent hover:border-[var(--color-blue)]/40"
          }`;

          if (!item.enabled) {
            return (
              <span
                key={item.label}
                className={`${className} cursor-default`}
                title="Screen not built yet — label reserved per Appearance spec"
              >
                {item.label}
              </span>
            );
          }

          return (
            <Link key={item.label} href={item.href} className={className}>
              {item.label}
            </Link>
          );
        })}
      </div>

      {isAdmin ? (
        <div className="relative flex items-center" ref={siteRef}>
          <button
            type="button"
            title="Site"
            aria-label="Site"
            aria-expanded={siteOpen}
            className={`flex items-center gap-1 px-3.5 ${
              siteActive
                ? "border-b-2 border-[var(--color-blue)] font-bold"
                : "border-b-2 border-transparent hover:border-[var(--color-blue)]/40"
            }`}
            onClick={() => setSiteOpen((v) => !v)}
          >
            Site
            <span className="text-[10px] leading-none" aria-hidden="true">
              ▾
            </span>
          </button>
          {siteOpen ? (
            <div className="absolute right-0 top-full z-40 mt-1 min-w-[180px] rounded border border-[var(--color-blue)]/20 bg-white py-1 shadow-md">
              {SITE_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 text-left text-sm text-[var(--color-blue)] hover:bg-[var(--color-table-tint)]"
                  onClick={() => setSiteOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </nav>
  );
}

export function AppShell({
  children,
  isAdmin = false,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <div className="sticky top-0 z-50">
        <TopBar />
        <NavBar isAdmin={isAdmin} />
      </div>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5">{children}</main>
      {/* Spec: footer not mid-page sticky — appears after full scroll */}
      <footer className="mt-auto border-t border-[var(--color-blue)]/10 bg-white px-4 py-3 text-center text-xs text-[var(--color-blue)]/55">
        MyCRM · DALKO Resources
      </footer>
    </div>
  );
}
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Primary link bar — labels/order from Appearance written spec */
const PRIMARY_NAV: Array<{
  href: string;
  label: string;
  enabled: boolean;
}> = [
  { href: "/leads", label: "Leads", enabled: true },
  { href: "/prospects", label: "Prospects", enabled: true },
  { href: "/clients", label: "Clients", enabled: true },
  { href: "/contacts", label: "Contacts", enabled: true },
  { href: "/campaigns", label: "Campaigns", enabled: true },
  { href: "/claims", label: "Claims", enabled: true },
];

/** Moved under More per Appearance spec */
const MORE_NAV = [
  { href: "/enquiry", label: "Enquiry" },
  { href: "/feeds", label: "Feeds" },
  { href: "/survey", label: "Survey" },
] as const;

function MoreIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
      className="fill-current"
    >
      <circle cx="3" cy="9" r="1.6" />
      <circle cx="9" cy="9" r="1.6" />
      <circle cx="15" cy="9" r="1.6" />
    </svg>
  );
}

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

      {/* Spec: logo center-aligned. Logo1 has a black plate — lighten blend
          drops the black against the navy bar so the globe/wordmark read cleanly. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Image
          src="/brand/Logo1.png"
          alt="DALKO Resources"
          width={260}
          height={64}
          className="h-[52px] w-auto object-contain"
          priority
        />
      </div>

      {/* Spec: username not shown; hover text = user name. Mockup = white circle. */}
      <div className="z-10 ml-auto shrink-0">
        <button
          type="button"
          title="DEMO SALESPERSON"
          className="h-10 w-10 rounded-full bg-white shadow-sm"
          style={{ fontFamily: "var(--font-heading)" }}
          aria-label="User menu"
        />
      </div>
    </header>
  );
}

export function NavBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
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

      <div className="relative flex items-center" ref={moreRef}>
        <button
          type="button"
          title="More Options"
          aria-label="More Options"
          aria-expanded={moreOpen}
          className="flex h-9 w-9 items-center justify-center rounded text-[var(--color-blue)] hover:bg-black/5"
          onClick={() => setMoreOpen((v) => !v)}
        >
          <MoreIcon />
        </button>
        {moreOpen ? (
          <div className="absolute right-0 top-full z-40 mt-1 min-w-[168px] rounded border border-[var(--color-blue)]/20 bg-white py-1 shadow-md">
            {MORE_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 text-left text-sm text-[var(--color-blue)] hover:bg-[var(--color-table-tint)]"
                onClick={() => setMoreOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <div className="sticky top-0 z-50">
        <TopBar />
        <NavBar />
      </div>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5">{children}</main>
      {/* Spec: footer not mid-page sticky — appears after full scroll */}
      <footer className="mt-auto border-t border-[var(--color-blue)]/10 bg-white px-4 py-3 text-center text-xs text-[var(--color-blue)]/55">
        MyCRM · DALKO Resources
      </footer>
    </div>
  );
}
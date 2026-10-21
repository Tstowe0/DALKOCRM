"use client";

import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/login/actions";
import { useActor } from "@/lib/use-actor";

export function UserMenu() {
  const { displayName, email, initials } = useActor();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title={displayName}
        aria-label="User menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[13px] font-bold tracking-wide text-[var(--color-blue)] shadow-sm"
        style={{ fontFamily: "var(--font-heading)" }}
        onClick={() => setOpen((v) => !v)}
      >
        {initials}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[220px] rounded border border-white/20 bg-white py-1 text-[var(--color-blue)] shadow-md">
          <div className="border-b border-[var(--color-blue)]/10 px-3 py-2">
            <p className="text-sm font-semibold">{displayName}</p>
            {email ? (
              <p className="mt-0.5 text-xs text-[var(--color-blue)]/65">{email}</p>
            ) : null}
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-table-tint)]"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type MoreMenuItem = {
  label: string;
  onClick?: () => void;
  href?: string;
  /** Open href in a new tab (attachment View, etc.) */
  external?: boolean;
  danger?: boolean;
};

/**
 * Row More menu. Portals to document.body so overflow-x-auto tables
 * do not clip the list (Library: three-dot, hover More Options).
 */
export function MoreMenu({
  items,
  title = "More options",
}: {
  items: MoreMenuItem[];
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  function place() {
    const btn = btnRef.current;
    const menu = menuRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const menuH = menu?.offsetHeight ?? items.length * 32 + 8;
    const menuW = menu?.offsetWidth ?? 180;
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < menuH + 8 && r.top > menuH;
    const top = openUp ? r.top - menuH - 4 : r.bottom + 4;
    const left = Math.min(
      Math.max(8, r.left),
      window.innerWidth - menuW - 8
    );
    setPos({ top, left });
  }

  useLayoutEffect(() => {
    if (open) place();
  }, [open, items.length]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onReposition() {
      place();
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open]);

  const itemClass =
    "block w-full px-3 py-1.5 text-left text-sm text-[var(--color-blue)] hover:bg-[var(--color-table-tint)]";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        title={title}
        aria-label={title}
        aria-expanded={open}
        className="rounded px-2 hover:bg-black/5"
        onClick={() => setOpen((v) => !v)}
      >
        ⋯
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[200] min-w-[180px] rounded border border-[var(--color-table-line)]/30 bg-white py-1 shadow-md"
              style={{ top: pos.top, left: pos.left }}
            >
              {items.map((item) =>
                item.href && item.external ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className={itemClass}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </a>
                ) : item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={itemClass}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    className={`${itemClass} ${
                      item.danger ? "text-[var(--color-danger)]" : ""
                    }`}
                    onClick={() => {
                      setOpen(false);
                      item.onClick?.();
                    }}
                  >
                    {item.label}
                  </button>
                )
              )}
            </div>,
            document.body
          )
        : null}
    </>
  );
}

"use client";

/** Shared overlay for every popup — dim + blur. Add z-[90]/z-[100]/… at the call site. */
export const POPUP_OVERLAY =
  "fixed inset-0 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm";

export const POPUP_BTN_CANCEL =
  "h-9 rounded border border-[var(--color-blue)]/25 bg-white px-4 text-sm text-[var(--color-blue)]";

export const POPUP_BTN_PRIMARY =
  "h-9 rounded bg-[var(--color-blue)] px-4 font-[family-name:var(--font-heading)] text-sm font-semibold text-white disabled:opacity-50";

export const POPUP_BTN_GOLD =
  "h-9 rounded bg-[var(--color-gold)] px-4 font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--color-blue)] disabled:opacity-50";

type Props = {
  open?: boolean;
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  zClass?: string;
  maxWidthClass?: string;
  padded?: boolean;
  footerClassName?: string;
};

/**
 * System popup chrome — navy title bar, white body, footer actions.
 * Match Import Clients / every work-surface modal.
 */
export function PopupWindow({
  open = true,
  title,
  onClose,
  children,
  footer,
  zClass = "z-[90]",
  maxWidthClass = "max-w-lg",
  padded = true,
  footerClassName = "flex justify-end gap-2",
}: Props) {
  if (!open) return null;

  return (
    <div className={`${POPUP_OVERLAY} ${zClass}`}>
      <div
        className={`flex max-h-[90vh] w-full ${maxWidthClass} flex-col overflow-hidden rounded border border-[var(--color-blue)]/30 bg-white shadow-lg`}
      >
        <div className="flex items-center justify-between bg-[var(--color-blue)] px-4 py-2 text-white">
          <h2
            className="text-sm font-bold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {title}
          </h2>
          <button
            type="button"
            className="text-lg leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div
          className={
            padded
              ? "min-h-0 flex-1 overflow-auto p-4"
              : "min-h-0 flex-1 overflow-auto"
          }
        >
          {children}
        </div>
        {footer ? (
          <div
            className={`${footerClassName} border-t border-[var(--color-blue)]/10 px-4 py-3`}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

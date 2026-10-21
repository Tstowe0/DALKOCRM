"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  POPUP_BTN_CANCEL,
  POPUP_BTN_PRIMARY,
  PopupWindow,
} from "@/components/shell/PopupWindow";

export { POPUP_OVERLAY } from "@/components/shell/PopupWindow";

type DialogKind = "confirm" | "alert";

type DialogRequest = {
  kind: DialogKind;
  message: string;
  resolve: (ok: boolean) => void;
};

type DialogApi = {
  confirm: (message: string) => Promise<boolean>;
  alert: (message: string) => Promise<void>;
};

const DialogContext = createContext<DialogApi | null>(null);

export function useDialog(): DialogApi {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("useDialog must be used within DialogProvider");
  }
  return ctx;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<DialogRequest | null>(null);
  const queue = useRef<DialogRequest[]>([]);

  const push = useCallback((req: DialogRequest) => {
    setCurrent((open) => {
      if (open) {
        queue.current.push(req);
        return open;
      }
      return req;
    });
  }, []);

  const confirm = useCallback(
    (message: string) =>
      new Promise<boolean>((resolve) => {
        push({ kind: "confirm", message, resolve });
      }),
    [push]
  );

  const alert = useCallback(
    (message: string) =>
      new Promise<void>((resolve) => {
        push({
          kind: "alert",
          message,
          resolve: () => resolve(),
        });
      }),
    [push]
  );

  function close(ok: boolean) {
    current?.resolve(ok);
    const next = queue.current.shift() ?? null;
    setCurrent(next);
  }

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {current ? (
        <ThemedDialog
          kind={current.kind}
          message={current.message}
          onOk={() => close(true)}
          onCancel={() => close(false)}
        />
      ) : null}
    </DialogContext.Provider>
  );
}

function ThemedDialog({
  kind,
  message,
  onOk,
  onCancel,
}: {
  kind: DialogKind;
  message: string;
  onOk: () => void;
  onCancel: () => void;
}) {
  const okRef = useRef<HTMLButtonElement>(null);
  const settled = useRef(false);

  useEffect(() => {
    settled.current = false;
    okRef.current?.focus();
  }, [message]);

  function finish(ok: boolean) {
    if (settled.current) return;
    settled.current = true;
    if (ok) onOk();
    else onCancel();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        finish(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOk, onCancel, message]);

  return (
    <PopupWindow
      title={kind === "confirm" ? "Confirm" : "Notice"}
      zClass="z-[200]"
      maxWidthClass="max-w-[min(28rem,calc(100vw-2rem))]"
      onClose={() => finish(false)}
      footer={
        <>
          {kind === "confirm" ? (
            <button
              type="button"
              className={POPUP_BTN_CANCEL}
              onClick={() => finish(false)}
            >
              Cancel
            </button>
          ) : null}
          <button
            ref={okRef}
            type="button"
            className={POPUP_BTN_PRIMARY}
            onClick={() => finish(true)}
          >
            OK
          </button>
        </>
      }
    >
      <p
        id="themed-dialog-message"
        className="text-sm leading-relaxed text-[var(--color-table-line)]"
        role="alertdialog"
        aria-modal="true"
      >
        {message}
      </p>
    </PopupWindow>
  );
}

"use client";

import { useFormStatus } from "react-dom";
import { signInWithMicrosoft } from "@/app/login/actions";

function MicrosoftMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 21 21" aria-hidden="true">
      <rect fill="#f25022" x="1" y="1" width="9" height="9" />
      <rect fill="#7fba00" x="11" y="1" width="9" height="9" />
      <rect fill="#00a4ef" x="1" y="11" width="9" height="9" />
      <rect fill="#ffb900" x="11" y="11" width="9" height="9" />
    </svg>
  );
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="flex h-9 w-full items-center justify-center gap-2 rounded bg-[var(--color-gold)] px-4 text-sm font-bold text-[var(--color-blue)] hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
      style={{ fontFamily: "var(--font-heading)" }}
    >
      <MicrosoftMark />
      {pending ? "Continuing to Microsoft…" : "Sign in with Microsoft"}
    </button>
  );
}

export function LoginCard({
  callbackUrl,
  error,
  configured,
}: {
  callbackUrl?: string;
  error?: string;
  configured: boolean;
}) {
  const message =
    error === "AccessDenied"
      ? "Use your Dalko Microsoft account (@shipdalko.com)."
      : error === "Configuration" || !configured
        ? "Sign-in is not configured. Add the client secret to .env.local and restart."
        : error
          ? "Sign-in failed. Try again."
          : null;

  return (
    <div className="w-full max-w-[400px] overflow-hidden rounded border border-[var(--color-blue)]/25 bg-white shadow-[0_8px_24px_rgba(11,24,62,0.12)]">
      <div className="bg-[var(--color-blue)] px-4 py-2.5">
        <h1
          className="text-center text-sm font-bold tracking-wide text-white"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Sign In
        </h1>
      </div>
      <div className="px-5 py-5 text-center">
        <p className="text-sm leading-relaxed text-[var(--color-blue)]">
          Continue to MyCRM with your Microsoft Account.
        </p>
        {message ? (
          <p className="mt-3 text-xs italic text-[var(--color-danger)]">
            {message}
          </p>
        ) : null}
        <form
          className="mt-5"
          action={async () => {
            await signInWithMicrosoft(callbackUrl);
          }}
        >
          <SubmitButton disabled={!configured} />
        </form>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-[var(--color-blue)]/45">
          Microsoft will sign you in. MyCRM does not ask for or store your
          password.
        </p>
      </div>
    </div>
  );
}

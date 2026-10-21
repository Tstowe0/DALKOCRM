"use client";

import { useSession } from "next-auth/react";

const FALLBACK_NAME = "DEMO SALESPERSON";

export function initialsFrom(name: string, email = "") {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const local = email.split("@")[0] ?? "";
  const emailParts = local.split(/[._-]+/).filter(Boolean);
  if (emailParts.length >= 2) {
    return `${emailParts[0][0]}${emailParts[1][0]}`.toUpperCase();
  }
  return (local.slice(0, 2) || "ME").toUpperCase();
}

export function useActor() {
  const { data } = useSession();
  const displayName = data?.user?.name?.trim() || FALLBACK_NAME;
  const email = data?.user?.email?.trim() || "";
  return {
    displayName,
    fullName: displayName.toUpperCase(),
    email,
    initials: initialsFrom(displayName, email),
  };
}

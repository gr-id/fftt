"use client";

import { signInWithPopup } from "firebase/auth";

import { ensureAnonymousUser } from "@/lib/anonymous-user";
import { createGoogleProvider, getFirebaseClientAuth } from "@/lib/firebase-client";

export type AuthProviderState = {
  linkedAt?: string;
  mode: "mock" | "real";
  provider: "anonymous" | "google";
};

export type AuthState = {
  displayName: string;
  environment: "production" | "stage";
  mockGoogleLinked: boolean;
  primaryAuthType: "anonymous" | "google";
  providers: AuthProviderState[];
  userId: string;
};

export async function fetchAuthState(userId: string) {
  const response = await fetch(`/api/auth/me?userId=${userId}`, { cache: "no-store" });
  const payload = (await response.json()) as AuthState | { error?: { message?: string } };

  if (!response.ok || !("userId" in payload)) {
    throw new Error(("error" in payload ? payload.error?.message : undefined) ?? "Failed to load auth state.");
  }

  return payload;
}

export async function linkGoogleOnProduction() {
  const anonymousUser = await ensureAnonymousUser();
  const auth = getFirebaseClientAuth();
  const credential = await signInWithPopup(auth, createGoogleProvider());
  const idToken = await credential.user.getIdToken();

  const response = await fetch("/api/auth/google/link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idToken,
      userId: anonymousUser.userId,
    }),
  });
  const payload = (await response.json()) as AuthState | { error?: { message?: string } };

  if (!response.ok || !("userId" in payload)) {
    throw new Error(("error" in payload ? payload.error?.message : undefined) ?? "Failed to link Google account.");
  }

  return payload;
}

export async function mockLinkGoogleOnStage() {
  const anonymousUser = await ensureAnonymousUser();
  const response = await fetch("/api/auth/google/mock-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: anonymousUser.userId,
    }),
  });
  const payload = (await response.json()) as AuthState | { error?: { message?: string } };

  if (!response.ok || !("userId" in payload)) {
    throw new Error(("error" in payload ? payload.error?.message : undefined) ?? "Failed to mock-link Google account.");
  }

  return payload;
}

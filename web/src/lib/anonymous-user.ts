export const ANONYMOUS_TOKEN_KEY = "fftt.anonymous-token";
export const USER_ID_KEY = "fftt.user-id";
export const DISPLAY_NAME_KEY = "fftt.display-name";

export type AnonymousUser = {
  anonymousToken: string;
  displayName: string;
  userId: string;
};

function readStoredUser(): AnonymousUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const anonymousToken = window.localStorage.getItem(ANONYMOUS_TOKEN_KEY);
  const displayName = window.localStorage.getItem(DISPLAY_NAME_KEY);
  const userId = window.localStorage.getItem(USER_ID_KEY);

  if (!anonymousToken || !displayName || !userId) {
    return null;
  }

  return { anonymousToken, displayName, userId };
}

export function storeAnonymousUser(user: AnonymousUser) {
  window.localStorage.setItem(ANONYMOUS_TOKEN_KEY, user.anonymousToken);
  window.localStorage.setItem(DISPLAY_NAME_KEY, user.displayName);
  window.localStorage.setItem(USER_ID_KEY, user.userId);
}

export async function ensureAnonymousUser(): Promise<AnonymousUser> {
  const stored = readStoredUser();
  const response = await fetch("/api/users/anonymous", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      anonymousToken: stored?.anonymousToken ?? null,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(payload?.error?.message ?? "Unable to create an anonymous user.");
  }

  const user = (await response.json()) as AnonymousUser;
  storeAnonymousUser(user);
  return user;
}

export function getStoredUserId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(USER_ID_KEY);
}

export function updateStoredDisplayName(displayName: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DISPLAY_NAME_KEY, displayName);
}

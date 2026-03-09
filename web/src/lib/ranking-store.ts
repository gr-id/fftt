import { randomUUID } from "node:crypto";

import { Timestamp } from "firebase-admin/firestore";

import { firestore } from "@/lib/firebase-admin";
import { MBTI_MAP } from "@/lib/mbti";
import type { EvaluationResult } from "@/lib/training-evaluator";

export type AuthProvider = "anonymous" | "google";

export type AnonymousUserSession = {
  anonymousToken: string;
  displayName: string;
  userId: string;
};

export type LeaderboardEntry = {
  attemptCount: number;
  bestScore: number;
  displayName: string;
  lastPlayedAt: string;
  rank: number;
  targetMbti: string | null;
  totalScore: number;
  userId: string;
};

export type Standing = {
  attemptCount: number;
  bestScore: number;
  rank: number | null;
  totalScore: number;
};

export type CurrentStanding = {
  displayName: string;
  mbti: Standing | null;
  overall: Standing | null;
  userId: string;
};

export type AuthProviderState = {
  linkedAt?: string;
  mode: "mock" | "real";
  provider: AuthProvider;
};

export type AuthState = {
  displayName: string;
  environment: "production" | "stage";
  mockGoogleLinked: boolean;
  primaryAuthType: AuthProvider;
  providers: AuthProviderState[];
  userId: string;
};

type UserDocument = {
  createdAt: Timestamp;
  displayName: string;
  id: string;
  lastSeenAt: Timestamp;
  mockLinkedProvider?: "google" | null;
  primaryAuthType: AuthProvider;
};

type IdentityDocument = {
  createdAt: Timestamp;
  linkedAt: Timestamp;
  provider: AuthProvider;
  providerUserId: string;
  userId: string;
};

type LeaderboardDocument = {
  attemptCount: number;
  bestScore: number;
  displayName: string;
  lastPlayedAt: Timestamp;
  targetMbti: string | null;
  totalScore: number;
  userId: string;
};

type AttemptDocument = {
  answer: string;
  attemptKey: string;
  createdAt: Timestamp;
  exemplarAnswer: string;
  keyPoints: string[];
  prompt: string;
  responseSource: EvaluationResult["responseSource"];
  score: number;
  sessionId: string;
  summary: string;
  targetMbti: string;
  userId: string;
};

const USERS = "users";
const IDENTITIES = "user_auth_identities";
const ATTEMPTS = "training_attempts";
const TOTALS = "leaderboard_totals";
const MBTI_TOTALS = "leaderboard_mbti";

const NICKNAME_ADJECTIVES = [
  "Calm",
  "Bright",
  "Kind",
  "Swift",
  "Warm",
  "Clear",
  "Bold",
  "Lucky",
  "Sunny",
  "Brave",
];

const NICKNAME_NAMES = [
  "Otter",
  "Maple",
  "River",
  "Nova",
  "Cloud",
  "Robin",
  "Wave",
  "Pine",
  "Comet",
  "Clover",
];

function makeIdentityId(provider: AuthProvider, providerUserId: string) {
  return `${provider}_${providerUserId}`;
}

function makeMbtiLeaderboardId(userId: string, targetMbti: string) {
  return `${targetMbti}_${userId}`;
}

function makeAttemptKey(userId: string, sessionId: string) {
  return `${userId}_${sessionId}`;
}

function makeNickname() {
  const adjective =
    NICKNAME_ADJECTIVES[Math.floor(Math.random() * NICKNAME_ADJECTIVES.length)];
  const name = NICKNAME_NAMES[Math.floor(Math.random() * NICKNAME_NAMES.length)];
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${adjective} ${name} ${suffix}`;
}

function toIsoString(value: Timestamp) {
  return value.toDate().toISOString();
}

function sortLeaderboard(entries: LeaderboardDocument[]) {
  return [...entries].sort((left, right) => {
    if (right.totalScore !== left.totalScore) {
      return right.totalScore - left.totalScore;
    }

    if (right.bestScore !== left.bestScore) {
      return right.bestScore - left.bestScore;
    }

    if (right.attemptCount !== left.attemptCount) {
      return right.attemptCount - left.attemptCount;
    }

    return left.lastPlayedAt.toMillis() - right.lastPlayedAt.toMillis();
  });
}

function toLeaderboardEntry(entry: LeaderboardDocument, rank: number): LeaderboardEntry {
  return {
    attemptCount: entry.attemptCount,
    bestScore: entry.bestScore,
    displayName: entry.displayName,
    lastPlayedAt: toIsoString(entry.lastPlayedAt),
    rank,
    targetMbti: entry.targetMbti,
    totalScore: entry.totalScore,
    userId: entry.userId,
  };
}

async function getUserDocument(userId: string) {
  const snapshot = await firestore.collection(USERS).doc(userId).get();
  return snapshot.exists ? (snapshot.data() as UserDocument) : null;
}

export async function createOrRestoreAnonymousUser(
  anonymousToken?: string | null,
): Promise<AnonymousUserSession> {
  if (anonymousToken) {
    const identityId = makeIdentityId("anonymous", anonymousToken);
    const identityRef = firestore.collection(IDENTITIES).doc(identityId);
    const identitySnapshot = await identityRef.get();

    if (identitySnapshot.exists) {
      const identity = identitySnapshot.data() as IdentityDocument;
      const userRef = firestore.collection(USERS).doc(identity.userId);
      const userSnapshot = await userRef.get();

      if (userSnapshot.exists) {
        await userRef.update({ lastSeenAt: Timestamp.now() });
        const user = userSnapshot.data() as UserDocument;
        return {
          anonymousToken,
          displayName: user.displayName,
          userId: user.id,
        };
      }
    }
  }

  const userId = randomUUID();
  const token = anonymousToken ?? randomUUID();
  const now = Timestamp.now();
  const displayName = makeNickname();
  const user: UserDocument = {
    createdAt: now,
    displayName,
    id: userId,
    lastSeenAt: now,
    mockLinkedProvider: null,
    primaryAuthType: "anonymous",
  };
  const identity: IdentityDocument = {
    createdAt: now,
    linkedAt: now,
    provider: "anonymous",
    providerUserId: token,
    userId,
  };

  await firestore.runTransaction(async (transaction) => {
    const identityRef = firestore.collection(IDENTITIES).doc(makeIdentityId("anonymous", token));
    const existingIdentity = await transaction.get(identityRef);

    if (existingIdentity.exists) {
      const existing = existingIdentity.data() as IdentityDocument;
      const existingUserRef = firestore.collection(USERS).doc(existing.userId);
      const existingUser = await transaction.get(existingUserRef);

      if (existingUser.exists) {
        transaction.update(existingUserRef, { lastSeenAt: now });
        return;
      }
    }

    transaction.set(firestore.collection(USERS).doc(userId), user);
    transaction.set(identityRef, identity);
  });

  const restored = await createOrRestoreAnonymousUser(token);
  return restored;
}

export async function getOverallLeaderboard(limit = 20) {
  const snapshot = await firestore.collection(TOTALS).get();
  const entries = snapshot.docs.map((documentSnapshot) => documentSnapshot.data() as LeaderboardDocument);
  return sortLeaderboard(entries)
    .slice(0, limit)
    .map((entry, index) => toLeaderboardEntry(entry, index + 1));
}

export async function getMbtiLeaderboard(targetMbti: string, limit = 20) {
  if (!MBTI_MAP[targetMbti]) {
    throw new Error("Unsupported MBTI.");
  }

  const snapshot = await firestore.collection(MBTI_TOTALS).where("targetMbti", "==", targetMbti).get();
  const entries = snapshot.docs.map((documentSnapshot) => documentSnapshot.data() as LeaderboardDocument);
  return sortLeaderboard(entries)
    .slice(0, limit)
    .map((entry, index) => toLeaderboardEntry(entry, index + 1));
}

function buildStanding(entries: LeaderboardDocument[], userId: string): Standing | null {
  const sorted = sortLeaderboard(entries);
  const index = sorted.findIndex((entry) => entry.userId === userId);
  if (index === -1) {
    return null;
  }

  const entry = sorted[index];
  return {
    attemptCount: entry.attemptCount,
    bestScore: entry.bestScore,
    rank: index + 1,
    totalScore: entry.totalScore,
  };
}

export async function getCurrentStanding(userId: string, targetMbti?: string | null) {
  const user = await getUserDocument(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  const [overallSnapshot, mbtiSnapshot] = await Promise.all([
    firestore.collection(TOTALS).get(),
    targetMbti && MBTI_MAP[targetMbti]
      ? firestore.collection(MBTI_TOTALS).where("targetMbti", "==", targetMbti).get()
      : Promise.resolve(null),
  ]);

  const overallEntries = overallSnapshot.docs.map(
    (documentSnapshot) => documentSnapshot.data() as LeaderboardDocument,
  );
  const mbtiEntries = mbtiSnapshot
    ? mbtiSnapshot.docs.map((documentSnapshot) => documentSnapshot.data() as LeaderboardDocument)
    : [];

  const standing: CurrentStanding = {
    displayName: user.displayName,
    mbti: targetMbti && MBTI_MAP[targetMbti] ? buildStanding(mbtiEntries, userId) : null,
    overall: buildStanding(overallEntries, userId),
    userId,
  };

  return standing;
}

export async function saveTrainingAttempt(params: {
  answer: string;
  evaluation: EvaluationResult;
  prompt: string;
  sessionId: string;
  targetMbti: string;
  userId: string;
}) {
  const { answer, evaluation, prompt, sessionId, targetMbti, userId } = params;
  const normalizedMbti = targetMbti.toUpperCase();

  if (!MBTI_MAP[normalizedMbti]) {
    throw new Error("Unsupported MBTI.");
  }

  const user = await getUserDocument(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  const attemptKey = makeAttemptKey(userId, sessionId);
  const attemptRef = firestore.collection(ATTEMPTS).doc(attemptKey);
  const totalRef = firestore.collection(TOTALS).doc(userId);
  const mbtiRef = firestore.collection(MBTI_TOTALS).doc(makeMbtiLeaderboardId(userId, normalizedMbti));

  await firestore.runTransaction(async (transaction) => {
    const [attemptSnapshot, totalSnapshot, mbtiSnapshot, userSnapshot] = await Promise.all([
      transaction.get(attemptRef),
      transaction.get(totalRef),
      transaction.get(mbtiRef),
      transaction.get(firestore.collection(USERS).doc(userId)),
    ]);

    if (!userSnapshot.exists) {
      throw new Error("User not found.");
    }

    if (attemptSnapshot.exists) {
      return;
    }

    const now = Timestamp.now();
    const attempt: AttemptDocument = {
      answer,
      attemptKey,
      createdAt: now,
      exemplarAnswer: evaluation.exemplarAnswer,
      keyPoints: evaluation.keyPoints,
      prompt,
      responseSource: evaluation.responseSource,
      score: evaluation.score,
      sessionId,
      summary: evaluation.summary,
      targetMbti: normalizedMbti,
      userId,
    };

    const currentTotal = totalSnapshot.exists
      ? (totalSnapshot.data() as LeaderboardDocument)
      : null;
    const currentMbti = mbtiSnapshot.exists
      ? (mbtiSnapshot.data() as LeaderboardDocument)
      : null;

    const totalDoc: LeaderboardDocument = {
      attemptCount: (currentTotal?.attemptCount ?? 0) + 1,
      bestScore: Math.max(currentTotal?.bestScore ?? 0, evaluation.score),
      displayName: user.displayName,
      lastPlayedAt: now,
      targetMbti: null,
      totalScore: (currentTotal?.totalScore ?? 0) + evaluation.score,
      userId,
    };
    const mbtiDoc: LeaderboardDocument = {
      attemptCount: (currentMbti?.attemptCount ?? 0) + 1,
      bestScore: Math.max(currentMbti?.bestScore ?? 0, evaluation.score),
      displayName: user.displayName,
      lastPlayedAt: now,
      targetMbti: normalizedMbti,
      totalScore: (currentMbti?.totalScore ?? 0) + evaluation.score,
      userId,
    };

    transaction.set(attemptRef, attempt);
    transaction.set(totalRef, totalDoc);
    transaction.set(mbtiRef, mbtiDoc);
    transaction.update(firestore.collection(USERS).doc(userId), {
      lastSeenAt: now,
    });
  });

  return getCurrentStanding(userId, normalizedMbti);
}

export async function getUserAuthState(userId: string, environment: "production" | "stage") {
  const user = await getUserDocument(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  const snapshot = await firestore.collection(IDENTITIES).where("userId", "==", userId).get();
  const providers: AuthProviderState[] = snapshot.docs.map((documentSnapshot) => {
    const identity = documentSnapshot.data() as IdentityDocument;
    return {
      linkedAt: toIsoString(identity.linkedAt),
      mode: "real" as const,
      provider: identity.provider,
    };
  });

  if (environment === "stage" && user.mockLinkedProvider === "google") {
    providers.push({
      mode: "mock",
      provider: "google",
    });
  }

  return {
    displayName: user.displayName,
    environment,
    mockGoogleLinked: environment === "stage" && user.mockLinkedProvider === "google",
    primaryAuthType: user.primaryAuthType,
    providers,
    userId,
  } satisfies AuthState;
}

export async function linkGoogleIdentity(params: {
  googleDisplayName?: string | null;
  googleSub: string;
  userId: string;
}) {
  const { googleDisplayName, googleSub, userId } = params;
  const now = Timestamp.now();
  const userRef = firestore.collection(USERS).doc(userId);
  const identityRef = firestore.collection(IDENTITIES).doc(makeIdentityId("google", googleSub));

  await firestore.runTransaction(async (transaction) => {
    const [userSnapshot, identitySnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(identityRef),
    ]);

    if (!userSnapshot.exists) {
      throw new Error("User not found.");
    }

    if (identitySnapshot.exists) {
      const linkedIdentity = identitySnapshot.data() as IdentityDocument;
      if (linkedIdentity.userId !== userId) {
        throw new Error("This Google account is already linked to another user.");
      }
    } else {
      transaction.set(identityRef, {
        createdAt: now,
        linkedAt: now,
        provider: "google",
        providerUserId: googleSub,
        userId,
      } satisfies IdentityDocument);
    }

    transaction.update(userRef, {
      displayName: googleDisplayName ?? userSnapshot.data()?.displayName,
      lastSeenAt: now,
      mockLinkedProvider: null,
      primaryAuthType: "google",
    });
  });

  return getUserAuthState(userId, "production");
}

export async function mockLinkGoogleIdentity(userId: string) {
  const userRef = firestore.collection(USERS).doc(userId);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    throw new Error("User not found.");
  }

  await userRef.update({
    lastSeenAt: Timestamp.now(),
    mockLinkedProvider: "google",
  });

  return getUserAuthState(userId, "stage");
}

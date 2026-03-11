import { Timestamp } from "firebase-admin/firestore";

import { firestore } from "@/lib/firebase-admin";

export type ProductEventName =
  | "history_opened"
  | "next_round_clicked"
  | "nickname_updated"
  | "training_completed"
  | "training_started"
  | "training_submitted";

type ProductEventDocument = {
  createdAt: Timestamp;
  eventName: ProductEventName;
  metadata: Record<string, boolean | number | string | null>;
  targetMbti?: string | null;
  userId?: string | null;
};

const PRODUCT_EVENTS = "product_events";

export async function recordProductEvent(params: {
  eventName: ProductEventName;
  metadata?: Record<string, boolean | number | string | null | undefined>;
  targetMbti?: string | null;
  userId?: string | null;
}) {
  const { eventName, metadata, targetMbti, userId } = params;
  const normalizedMetadata = Object.fromEntries(
    Object.entries(metadata ?? {}).map(([key, value]) => [key, value ?? null]),
  );

  await firestore.collection(PRODUCT_EVENTS).add({
    createdAt: Timestamp.now(),
    eventName,
    metadata: normalizedMetadata,
    targetMbti: targetMbti ?? null,
    userId: userId ?? null,
  } satisfies ProductEventDocument);
}

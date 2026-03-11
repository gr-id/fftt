"use client";

import type { ProductEventName } from "@/lib/analytics-store";

export async function trackProductEvent(params: {
  eventName: ProductEventName;
  metadata?: Record<string, boolean | number | string | null | undefined>;
  targetMbti?: string | null;
  userId?: string | null;
}) {
  try {
    await fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    // Event logging must never block the product flow.
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";

type DashboardStatsResponse = {
  users: {
    total: number;
    growthPctFromLastMonth: number | null;
    newLast30Days: number | null;
    newPrev30Days: number | null;
  };
  sponsors: {
    active: number;
    growthPctFromLastMonth: number | null;
    newLast30Days: number | null;
    newPrev30Days: number | null;
  };
  blog: {
    totalPosts: number;
    newThisWeek: number;
  };
  inquiries: {
    pending: number;
  };
  aiFeedback: {
    total: number;
    newThisWeek: number;
    sentimentScore: number;
  };
  timestamp: string;
};

function toMillis(value: any): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) return asNumber;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value?.toMillis === "function") {
    try {
      return value.toMillis();
    } catch {
      return null;
    }
  }
  if (value instanceof Date) return value.getTime();
  return null;
}

function computeGrowthPct(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous <= 0) {
    if (current <= 0) return 0;
    return 100;
  }
  return Math.round(((current - previous) / previous) * 100);
}

async function countWithFallback(
  collectionName: string,
  fieldName: string,
  startMs: number,
  endMs: number
): Promise<{ current: number | null; previous: number | null }> {
  const db = getAdminDb();

  // Fast path: try count aggregation queries.
  try {
    const currentSnap = await db
      .collection(collectionName)
      .where(fieldName, ">=", startMs)
      .where(fieldName, "<", endMs)
      .count()
      .get();

    const prevStart = startMs - (endMs - startMs);
    const prevSnap = await db
      .collection(collectionName)
      .where(fieldName, ">=", prevStart)
      .where(fieldName, "<", startMs)
      .count()
      .get();

    return {
      current: currentSnap.data().count,
      previous: prevSnap.data().count,
    };
  } catch {
    // Fallback: scan only the needed field and compute.
  }

  try {
    const snapshot = await db.collection(collectionName).select(fieldName).get();
    const windowMs = endMs - startMs;
    const prevStart = startMs - windowMs;

    let current = 0;
    let previous = 0;

    snapshot.forEach((doc) => {
      const ms = toMillis(doc.data()?.[fieldName]);
      if (ms == null) return;
      if (ms >= startMs && ms < endMs) current++;
      else if (ms >= prevStart && ms < startMs) previous++;
    });

    return { current, previous };
  } catch {
    return { current: null, previous: null };
  }
}

export const GET = withApi({
  auth: "admin",
  rateLimit: "admin",
}, async () => {
  const db = getAdminDb();
  const nowMs = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const usersTotalSnap = await db.collection("users").count().get();
  const usersTotal = usersTotalSnap.data().count;

  const usersWindow = await countWithFallback(
    "users",
    "createdAt",
    nowMs - thirtyDaysMs,
    nowMs
  );

  const sponsorsActiveSnap = await db
    .collection("sponsors")
    .where("isActive", "==", true)
    .count()
    .get();
  const sponsorsActive = sponsorsActiveSnap.data().count;

  const sponsorsWindow = await countWithFallback(
    "sponsors",
    "createdAt",
    nowMs - thirtyDaysMs,
    nowMs
  );

  const blogTotalSnap = await db.collection("blogPosts").count().get();
  const blogTotalPosts = blogTotalSnap.data().count;

  const blogNewThisWeekSnap = await db
    .collection("blogPosts")
    .where("createdAt", ">=", nowMs - sevenDaysMs)
    .count()
    .get();
  const blogNewThisWeek = blogNewThisWeekSnap.data().count;

  const pendingInquiriesSnap = await db
    .collection("contacts")
    .where("status", "==", "new")
    .count()
    .get();
  const pendingInquiries = pendingInquiriesSnap.data().count;

  // AI Feedback stats
  const feedbackTotalSnap = await db.collection("ai_feedback").count().get();
  const feedbackTotal = feedbackTotalSnap.data().count;

  const feedbackNewThisWeekSnap = await db
    .collection("ai_feedback")
    .where("createdAt", ">=", nowMs - sevenDaysMs)
    .count()
    .get();
  const feedbackNewThisWeek = feedbackNewThisWeekSnap.data().count;

  // Calculate sentiment score (percentage of positive feedback)
  let sentimentScore = 0;
  if (feedbackTotal > 0) {
    const positiveSnap = await db
      .collection("ai_feedback")
      .where("sentiment", "==", "positive")
      .count()
      .get();
    sentimentScore = Math.round((positiveSnap.data().count / feedbackTotal) * 100);
  }

  const response: DashboardStatsResponse = {
    users: {
      total: usersTotal,
      newLast30Days: usersWindow.current,
      newPrev30Days: usersWindow.previous,
      growthPctFromLastMonth:
        usersWindow.current == null || usersWindow.previous == null
          ? null
          : computeGrowthPct(usersWindow.current, usersWindow.previous),
    },
    sponsors: {
      active: sponsorsActive,
      newLast30Days: sponsorsWindow.current,
      newPrev30Days: sponsorsWindow.previous,
      growthPctFromLastMonth:
        sponsorsWindow.current == null || sponsorsWindow.previous == null
          ? null
          : computeGrowthPct(sponsorsWindow.current, sponsorsWindow.previous),
    },
    blog: {
      totalPosts: blogTotalPosts,
      newThisWeek: blogNewThisWeek,
    },
    inquiries: {
      pending: pendingInquiries,
    },
    aiFeedback: {
      total: feedbackTotal,
      newThisWeek: feedbackNewThisWeek,
      sentimentScore,
    },
    timestamp: new Date().toISOString(),
  };

  return response;
});

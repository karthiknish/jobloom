import { NextRequest } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

/**
 * GET /api/admin/analytics/time-series
 * Fetch time-series data for analytics charts
 */
export const GET = withApi({
  auth: "admin",
  rateLimit: "admin",
}, async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "30d";
  
  const db = getAdminDb();
  const now = new Date();
  let days = 30;

  if (range === "7d") days = 7;
  else if (range === "90d") days = 90;
  else if (range === "1y") days = 365;

  const startDate = startOfDay(subDays(now, days));
  
  // Initialize data map with all days in interval to ensure no gaps
  const dateInterval = eachDayOfInterval({
    start: startDate,
    end: now,
  });

  const statsMap: Record<string, { date: string; signups: number; applications: number; revenue: number }> = {};
  
  dateInterval.forEach(date => {
    const formattedDate = format(date, "MMM dd");
    const isoDate = format(date, "yyyy-MM-dd");
    statsMap[isoDate] = { date: formattedDate, signups: 0, applications: 0, revenue: 0 };
  });

  // 1. Fetch Users
  const usersSnapshot = await db.collection("users")
    .where("createdAt", ">=", startDate)
    .get();

  usersSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const created = data.createdAt?.toDate?.() || new Date(data.createdAt);
    const dateKey = format(created, "yyyy-MM-dd");
    if (statsMap[dateKey]) {
      statsMap[dateKey].signups++;
    }
  });

  // 2. Fetch Applications
  const appsSnapshot = await db.collection("applications")
    .where("createdAt", ">=", startDate)
    .get();

  appsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const created = data.createdAt?.toDate?.() || new Date(data.createdAt);
    const dateKey = format(created, "yyyy-MM-dd");
    if (statsMap[dateKey]) {
      statsMap[dateKey].applications++;
    }
  });

  // 3. Fetch Subscriptions/Revenue
  // Note: We use the 'subscriptions' collection which has 'price' and 'createdAt'
  const subSnapshot = await db.collection("subscriptions")
    .where("status", "==", "active")
    .where("createdAt", ">=", startDate)
    .get();

  subSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const created = data.createdAt?.toDate?.() || new Date(data.createdAt);
    const dateKey = format(created, "yyyy-MM-dd");
    const price = data.price || 0;
    if (statsMap[dateKey]) {
      statsMap[dateKey].revenue += price;
    }
  });

  // Transform to array and sort by date key
  const chartData = Object.keys(statsMap)
    .sort()
    .map(key => statsMap[key]);

  return {
    data: chartData,
    range,
    count: chartData.length,
    timestamp: new Date().toISOString(),
  };
});

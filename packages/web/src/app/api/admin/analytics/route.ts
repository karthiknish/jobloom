import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, verifyIdToken, isUserAdmin } from "@/firebase/admin";

/**
 * GET /api/admin/analytics
 * Fetch analytics metrics for the admin dashboard
 */
export async function GET(req: NextRequest) {
  try {
    // Auth check - admin only
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(token);
      if (!decodedToken) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    const isAdmin = await isUserAdmin(decodedToken.uid);
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const db = getAdminDb();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all users
    const usersSnapshot = await db.collection("users").get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate user metrics
    const totalUsers = users.length;
    const premiumUsers = users.filter((u: any) => {
      const isPremiumActive = u.subscriptionStatus === 'active';
      const isLegacyPremium = !u.subscriptionStatus && u.subscriptionPlan === 'premium';
      return isPremiumActive || isLegacyPremium;
    }).length;
    const freeUsers = totalUsers - premiumUsers;
    
    const newUsersToday = users.filter((u: any) => {
      const created = u.createdAt?.toDate?.() || new Date(u.createdAt);
      return created >= today;
    }).length;
    
    const newUsersThisWeek = users.filter((u: any) => {
      const created = u.createdAt?.toDate?.() || new Date(u.createdAt);
      return created >= weekAgo;
    }).length;
    
    const newUsersThisMonth = users.filter((u: any) => {
      const created = u.createdAt?.toDate?.() || new Date(u.createdAt);
      return created >= monthAgo;
    }).length;

    // Active users
    const activeToday = users.filter((u: any) => {
      const lastLogin = u.lastLoginAt?.toDate?.() || new Date(u.lastLoginAt || 0);
      return lastLogin >= today;
    }).length;
    
    const activeThisWeek = users.filter((u: any) => {
      const lastLogin = u.lastLoginAt?.toDate?.() || new Date(u.lastLoginAt || 0);
      return lastLogin >= weekAgo;
    }).length;
    
    const activeThisMonth = users.filter((u: any) => {
      const lastLogin = u.lastLoginAt?.toDate?.() || new Date(u.lastLoginAt || 0);
      return lastLogin >= monthAgo;
    }).length;

    // Fetch applications
    const applicationsSnapshot = await db.collection("applications").get();
    const applications = applicationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const totalApplications = applications.length;
    const applicationsThisWeek = applications.filter((a: any) => {
      const created = a.createdAt?.toDate?.() || new Date(a.createdAt);
      return created >= weekAgo;
    }).length;

    // Application status breakdown
    const statusBreakdown: Record<string, number> = {};
    applications.forEach((a: any) => {
      const status = a.status || 'unknown';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    // Fetch CV analyses
    const cvAnalysesSnapshot = await db.collection("cvAnalyses").get();
    const totalCvAnalyses = cvAnalysesSnapshot.size;

    // Fetch recent events from analyticsEvents if exists
    let recentEvents: any[] = [];
    try {
      const eventsQuery = await db.collection("analyticsEvents")
        .orderBy("timestamp", "desc")
        .limit(100)
        .get();
      recentEvents = eventsQuery.docs.map(doc => doc.data());
    } catch {
      // Collection may not exist
    }

    // Calculate conversion rates
    const conversionMetrics = {
      signupToFirstJob: 0,
      signupToCvUpload: 0,
      signupToPremium: 0,
      freeToPayingConversion: totalUsers > 0 
        ? Math.round((premiumUsers / totalUsers) * 10000) / 100 
        : 0,
    };

    // Calculate feature usage
    const featureUsage = {
      cvEvaluator: totalCvAnalyses,
      sponsorChecker: recentEvents.filter(e => e.eventType === 'job_sponsor_check').length,
      exportFeature: recentEvents.filter(e => e.eventType === 'dashboard_export_used').length,
      extensionConnected: recentEvents.filter(e => e.eventType === 'extension_connected').length,
    };

    // Top events
    const eventCounts: Record<string, number> = {};
    recentEvents.forEach(e => {
      const type = e.eventType || 'unknown';
      eventCounts[type] = (eventCounts[type] || 0) + 1;
    });
    const topEvents = Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([event, count]) => ({ event, count }));

    // Build response
    const metrics = {
      users: {
        total: totalUsers,
        premium: premiumUsers,
        free: freeUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth,
      },
      activeUsers: {
        daily: activeToday,
        weekly: activeThisWeek,
        monthly: activeThisMonth,
      },
      applications: {
        total: totalApplications,
        thisWeek: applicationsThisWeek,
        avgPerUser: totalUsers > 0 
          ? Math.round((totalApplications / totalUsers) * 10) / 10 
          : 0,
        statusBreakdown,
      },
      features: {
        cvAnalyses: totalCvAnalyses,
        usage: featureUsage,
      },
      conversions: conversionMetrics,
      events: {
        top: topEvents,
        recentCount: recentEvents.length,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    });

  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";

// Zod schema for query parameters
const emailExportQuerySchema = z.object({
  segment: z.string().max(50).optional(),
  format: z.enum(["csv", "json"]).default("csv"),
  activeOnly: z.enum(["true", "false"]).transform(v => v === "true").optional().default(false),
});

export const GET = withApi({
  auth: "admin",
  rateLimit: "admin",
  querySchema: emailExportQuerySchema,
}, async ({ query }) => {
  const { segment, format, activeOnly } = query;

  const db = getAdminDb();

  // Build query
  let usersQuery: any = db.collection('users');
  
  if (activeOnly) {
    usersQuery = usersQuery.where('emailPreferences.marketing', '==', true);
  }

  const snapshot = await usersQuery.get();
  const emailList: any[] = [];

  snapshot.forEach((doc: any) => {
    const userData = doc.data();
    if (userData.email) {
      const userSegment = getUserSegment(userData);
      
      // Filter by segment if specified
      if (!segment || userSegment === segment) {
        emailList.push({
          email: userData.email,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          marketingEmails: userData.emailPreferences?.marketing ?? true,
          segment: userSegment,
          createdAt: userData.createdAt || '',
          lastActiveAt: userData.lastActiveAt || '',
          source: userData.source || 'organic'
        });
      }
    }
  });

  if (format === 'csv') {
    // Generate CSV
    const headers = ['Email', 'First Name', 'Last Name', 'Marketing Emails', 'Segment', 'Created At', 'Last Active', 'Source'];
    const csvRows = [
      headers.join(','),
      ...emailList.map(user => [
        user.email,
        `"${user.firstName}"`,
        `"${user.lastName}"`,
        user.marketingEmails ? 'Yes' : 'No',
        user.segment,
        user.createdAt,
        user.lastActiveAt,
        user.source
      ].join(','))
    ];

    const csv = csvRows.join('\n');
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="email-list-${segment || 'all'}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } else {
    // JSON format
    return new NextResponse(JSON.stringify(emailList, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="email-list-${segment || 'all'}-${new Date().toISOString().split('T')[0]}.json"`
      }
    });
  }
});

function getUserSegment(userData: any): string {
  // Define user segments based on their data
  if (userData.isAdmin) return 'admin';
  if (userData.subscription?.tier === 'premium') return 'premium';
  if (userData.subscription?.tier === 'basic') return 'basic';
  if (userData.createdAt && new Date(userData.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) return 'new_users';
  if (userData.lastActiveAt && new Date(userData.lastActiveAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) return 'active_users';
  return 'all_users';
}

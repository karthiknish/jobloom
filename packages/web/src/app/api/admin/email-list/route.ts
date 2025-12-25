import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { withApi, z } from "@/lib/api/withApi";

// Zod schema for GET query parameters
const emailListQuerySchema = z.object({
  segment: z.string().max(50).optional(),
  activeOnly: z.enum(["true", "false"]).transform(v => v === "true").optional().default(false),
});

// Zod schema for POST body
const emailListPostSchema = z.object({
  emails: z.array(z.object({
    email: z.string().email(),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
  })).min(1, "At least one email is required"),
  segment: z.string().max(50).optional(),
  subscribeAll: z.boolean().optional().default(true),
});

export const GET = withApi({
  auth: "admin",
  rateLimit: "admin",
  querySchema: emailListQuerySchema,
}, async ({ query }) => {
  const { segment, activeOnly } = query;

  const db = getAdminDb();

  // Build query
  let usersQuery = db.collection('users') as any;
  
  if (activeOnly) {
    usersQuery = usersQuery.where('emailPreferences.marketing', '==', true);
  }

  const snapshot = await usersQuery.get();
  const emailList: any[] = [];

  snapshot.forEach((doc: any) => {
    const userData = doc.data();
    if (userData.email) {
      emailList.push({
        id: doc.id,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        marketingEmails: userData.emailPreferences?.marketing ?? true,
        segment: getUserSegment(userData),
        createdAt: userData.createdAt || null,
        lastActiveAt: userData.lastActiveAt || null
      });
    }
  });

  // Filter by segment if specified
  const filteredList = segment 
    ? emailList.filter(user => user.segment === segment)
    : emailList;

  return {
    emailList: filteredList,
    total: filteredList.length,
    segments: getSegmentStats(emailList)
  };
});

export const POST = withApi({
  auth: "admin",
  rateLimit: "admin",
  bodySchema: emailListPostSchema,
}, async ({ body }) => {
  const { emails, subscribeAll } = body;

  const db = getAdminDb();
  const results = [];
  const errors = [];

  for (const emailData of emails) {
    try {
      const { email, firstName, lastName } = emailData;

      // Check if user exists
      const existingUserQuery = await db.collection('users')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (!existingUserQuery.empty) {
        // Update existing user
        const userDoc = existingUserQuery.docs[0];
        await userDoc.ref.set({
          emailPreferences: {
            marketing: subscribeAll !== false,
            updatedAt: new Date().toISOString()
          },
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          updatedAt: new Date().toISOString()
        }, { merge: true });

        results.push({ 
          email, 
          action: 'updated',
          userId: userDoc.id 
        });
      } else {
        // Create new user entry for email list
        const newUserRef = db.collection('users').doc();
        await newUserRef.set({
          email: email.toLowerCase(),
          firstName: firstName || '',
          lastName: lastName || '',
          emailPreferences: {
            marketing: subscribeAll !== false,
            updatedAt: new Date().toISOString()
          },
          source: 'email_list_import',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        results.push({ 
          email, 
          action: 'created',
          userId: newUserRef.id 
        });
      }
    } catch (error) {
      errors.push({ 
        email: emailData.email, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return {
    processed: results.length,
    errors: errors.length,
    results
  };
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

function getSegmentStats(emailList: any[]): Record<string, number> {
  const stats: Record<string, number> = {};
  
  emailList.forEach(user => {
    stats[user.segment] = (stats[user.segment] || 0) + 1;
  });
  
  return stats;
}

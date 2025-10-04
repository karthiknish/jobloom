import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { getAuth } from "firebase-admin/auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Check if user is admin
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const segment = searchParams.get('segment');
    const activeOnly = searchParams.get('activeOnly') === 'true';

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

    return NextResponse.json({
      success: true,
      emailList: filteredList,
      total: filteredList.length,
      segments: getSegmentStats(emailList)
    });

  } catch (error) {
    console.error('❌ Error fetching email list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email list' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Check if user is admin
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { emails, segment, subscribeAll } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid emails array' 
      }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const emailData of emails) {
      try {
        const { email, firstName, lastName } = emailData;
        
        if (!email || !validateEmail(email)) {
          errors.push({ email, error: 'Invalid email address' });
          continue;
        }

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

    return NextResponse.json({
      success: true,
      processed: results.length,
      errors: errors.length,
      results
    });

  } catch (error) {
    console.error('❌ Error updating email list:', error);
    return NextResponse.json(
      { error: 'Failed to update email list' },
      { status: 500 }
    );
  }
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

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

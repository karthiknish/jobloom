import { z } from "zod";
import { withApi, OPTIONS } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";

export const runtime = "nodejs";

export const GET = withApi({
  auth: 'admin',
  rateLimit: 'admin',
}, async () => {
  const db = getAdminDb();
  const usersSnapshot = await db.collection("users").get();
  
  const toMillis = (value: unknown): number | undefined => {
    if (typeof value === "number") {
      return value;
    }
    if (value instanceof Date) {
      return value.getTime();
    }
    if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
      try {
        return (value as { toMillis: () => number }).toMillis();
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  const users = usersSnapshot.docs.map(doc => {
    const data = doc.data();
    const createdAt = toMillis(data.createdAt) ?? Date.now();
    const updatedAt = toMillis(data.updatedAt);
    const lastLoginAt = toMillis(data.lastLoginAt);
    return {
      _id: doc.id,
      email: data.email || "",
      name: data.name || "",
      isAdmin: data.isAdmin || false,
      createdAt,
      updatedAt,
      lastLoginAt,
      emailVerified: data.emailVerified || false,
      subscriptionPlan: data.subscriptionPlan || undefined,
      subscriptionStatus: data.subscriptionStatus || null,
      provider: data.provider || null
    };
  });

  return {
    users,
    count: users.length,
    message: 'Users retrieved successfully'
  };
});

export const POST = withApi({
  auth: 'admin',
  rateLimit: 'admin',
  bodySchema: z.object({
    email: z.string().email(),
    name: z.string().min(2),
    password: z.string().min(8),
    isAdmin: z.boolean().optional().default(false),
  }),
}, async ({ body }) => {
  const { email, name, password, isAdmin } = body;
  const db = getAdminDb();
  const auth = require("firebase-admin").auth();

  try {
    // 1. Create user in Firebase Auth
    const user = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true,
    });

    // 2. Set custom claims if admin
    if (isAdmin) {
      await auth.setCustomUserClaims(user.uid, { admin: true });
    }

    // 3. Create user document in Firestore
    const userData = {
      email,
      name,
      isAdmin,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      emailVerified: true,
      firebaseUid: user.uid,
      subscriptionPlan: 'free',
      subscriptionStatus: 'active',
      provider: 'password'
    };

    await db.collection("users").doc(user.uid).set(userData);

    return {
      _id: user.uid,
      message: 'User created successfully'
    };
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      throw new Error('A user with this email already exists');
    }
    throw error;
  }
});

export { OPTIONS } from "@/lib/api/withApi";

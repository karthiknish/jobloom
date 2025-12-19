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

export { OPTIONS } from "@/lib/api/withApi";

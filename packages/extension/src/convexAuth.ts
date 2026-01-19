import { executeConvexQuery, executeConvexMutation } from "./convex";

interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
    imageUrl?: string;
  };
  error?: string;
}

export async function getAuthenticatedUser(): Promise<AuthResult> {
  try {
    const user = await executeConvexQuery("users:get", {});
    
    if (!user) {
      return {
        success: false,
        error: "No authenticated user",
      };
    }
    
    return {
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name || undefined,
        imageUrl: user.imageUrl || undefined,
      },
    };
  } catch (error) {
    console.error("[Hireall:Auth] Failed to get user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  const result = await getAuthenticatedUser();
  return result.success ? result.user!.id : null;
}

export async function createOrUpdateUserInConvex(
  email: string,
  name?: string,
  imageUrl?: string,
  firebaseUid?: string
): Promise<string> {
  const userId = await executeConvexMutation("users:createOrUpdateUser", {
    email,
    name,
    imageUrl,
    firebaseUid,
  });
  console.log("[Hireall:Auth] User synced to Convex:", userId);
  return userId;
}

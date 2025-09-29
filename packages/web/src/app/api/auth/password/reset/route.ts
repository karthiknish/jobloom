import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";

import { getAdminApp } from "@/firebase/admin";

interface ResetPayload {
  token?: string;
  password?: string;
}

export async function POST(request: Request) {
  try {
    const { token, password }: ResetPayload = await request.json().catch(() => ({}));

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid or missing token" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const admin = getAdminApp();
    const db = (await import("firebase-admin/firestore")).getFirestore(admin);
    const tokenDoc = await db.collection("passwordResets").doc(token).get();

    if (!tokenDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Reset link is invalid or expired" },
        { status: 400 }
      );
    }

    const tokenData = tokenDoc.data() as {
      userId: string;
      email: string;
      expiresAt: FirebaseFirestore.Timestamp | Date;
      used?: boolean;
    };

    if (!tokenData || !tokenData.userId || tokenData.used) {
      return NextResponse.json(
        { success: false, error: "Reset link has already been used" },
        { status: 400 }
      );
    }

    const expiresAt = tokenData.expiresAt instanceof Date ? tokenData.expiresAt : tokenData.expiresAt.toDate();
    if (expiresAt.getTime() < Date.now()) {
      await tokenDoc.ref.update({ used: true, expiredAt: new Date() });
      return NextResponse.json(
        { success: false, error: "Reset link has expired" },
        { status: 400 }
      );
    }

    const auth = getAuth(admin);
    await auth.updateUser(tokenData.userId, { password });
    await tokenDoc.ref.update({ used: true, consumedAt: new Date() });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reset password", error);
    return NextResponse.json(
      { success: false, error: "Unable to reset password" },
      { status: 500 }
    );
  }
}


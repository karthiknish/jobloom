import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { verifyIdToken } from "@/firebase/admin";

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken?.uid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { marketingEmails } = await request.json();

    if (typeof marketingEmails !== "boolean") {
      return NextResponse.json({ error: "marketingEmails must be a boolean" }, { status: 400 });
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(decodedToken.uid);

    // Update the user's email preferences in Firestore
    await userRef.set({
      emailPreferences: {
        marketing: marketingEmails,
        updatedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Also update the preferences collection for consistency
    await db.collection('preferences').doc(decodedToken.uid).set({
      marketingEmails,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({
      success: true,
      marketingEmails
    });

  } catch (error) {
    console.error("Error updating marketing preferences:", error);
    return NextResponse.json({ error: "Failed to update marketing preferences" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken?.uid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    const marketingEmails = userData?.emailPreferences?.marketing ?? true;

    return NextResponse.json({
      marketingEmails
    });

  } catch (error) {
    console.error("Error fetching marketing preferences:", error);
    return NextResponse.json({ error: "Failed to fetch marketing preferences" }, { status: 500 });
  }
}
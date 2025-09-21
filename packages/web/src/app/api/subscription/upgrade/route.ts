import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/firebase/admin";
import { getFirestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const config: any = {
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  };

  admin.initializeApp(config);
}

const db = getFirestore();

// POST /api/subscription/upgrade - Upgrade user subscription
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const body = await request.json();
    const { plan, billingCycle = "monthly" } = body;

    if (!plan || !["premium"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Only 'premium' is available for upgrade." },
        { status: 400 }
      );
    }

    // Get user record
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create or update subscription
    const subscriptionId = userData.subscriptionId || `sub_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    const subscriptionData = {
      userId,
      plan,
      status: "active",
      currentPeriodStart: admin.firestore.Timestamp.now(),
      currentPeriodEnd: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + (billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000)
      ),
      cancelAtPeriodEnd: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      // Mock payment data - in real implementation, this would come from Stripe
      stripeSubscriptionId: `mock_stripe_${subscriptionId}`,
      stripeCustomerId: `mock_customer_${userId}`,
      billingCycle,
      price: billingCycle === "yearly" ? 99.99 : 9.99,
    };

    // Save subscription
    await db.collection("subscriptions").doc(subscriptionId).set(subscriptionData);

    // Update user record with subscription ID
    await db.collection("users").doc(userId).update({
      subscriptionId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscriptionId,
        ...subscriptionData,
      },
      message: `Successfully upgraded to ${plan} plan`,
    });
  } catch (error) {
    console.error("Error upgrading subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const db = getAdminDb();
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const userSubdomain = userSnap.data()?.subdomain || null;

    const portfolioRef = userRef.collection('portfolio').doc('site');

    const portfolioSnap = await portfolioRef.get();
    if (!portfolioSnap.exists) {
      // Return default portfolio structure
      const defaultPortfolio = {
        templateId: "minimalist",
        title: "",
        description: "",
        theme: {
          primaryColor: "var(--primary)",
          secondaryColor: "var(--secondary)",
          fontFamily: "Inter",
          fontSize: "medium",
          spacing: "normal",
          borderRadius: "medium"
        },
        seo: {
          metaTitle: "",
          metaDescription: "",
          keywords: []
        },
        sections: [{
          id: "hero",
          type: "hero",
          title: "Hero",
          content: {
            headline: "Welcome to my portfolio",
            subheadline: "I'm a creative professional ready to bring your ideas to life",
            backgroundImage: "",
            ctaText: "Get In Touch",
            ctaLink: "#contact"
          },
          order: 0,
          visible: true
        }],
        socialLinks: {},
        analytics: {},
        settings: {
          isPublic: false,
          showContactForm: true,
          allowDownloads: false
        },
        subdomain: userSubdomain,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await portfolioRef.set(defaultPortfolio);
      return NextResponse.json(defaultPortfolio);
    }

    const portfolioData = portfolioSnap.data();
    return NextResponse.json({
      id: portfolioSnap.id,
      ...portfolioData,
      subdomain: userSubdomain || portfolioData?.subdomain || null
    });

  } catch (error) {
    console.error('Portfolio GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load portfolio' },
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
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const portfolioData = await request.json();

    // Validate required fields
    if (!portfolioData.templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const userSubdomain = userSnap.data()?.subdomain || null;

    if (portfolioData.subdomain && portfolioData.subdomain !== userSubdomain) {
      return NextResponse.json(
        { error: 'Subdomain mismatch. Use the subdomain settings to update your public link.' },
        { status: 400 }
      );
    }

    if (portfolioData.settings?.isPublic && !userSubdomain) {
      return NextResponse.json(
        { error: 'Claim a subdomain before publishing publicly.' },
        { status: 400 }
      );
    }

    const portfolioRef = userRef.collection('portfolio').doc('site');

    // Check if portfolio exists for versioning
    const existingSnap = await portfolioRef.get();
    let version = 1;
    if (existingSnap.exists) {
      const existingData = existingSnap.data();
      version = (existingData?.version || 1) + 1;
    }

    const portfolioToSave = {
      ...portfolioData,
       subdomain: userSubdomain,
      userId,
      version,
      updatedAt: new Date(),
      ...(existingSnap.exists ? {} : { createdAt: new Date() })
    };

    await portfolioRef.set(portfolioToSave, { merge: true });

    return NextResponse.json({
      id: 'site',
      ...portfolioToSave
    });

  } catch (error) {
    console.error('Portfolio POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save portfolio' },
      { status: 500 }
    );
  }
}

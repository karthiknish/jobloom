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
    const userId = decodedToken.uid;

    const db = getAdminDb();
    const portfolioRef = db.collection('users').doc(userId).collection('portfolio').doc('site');

    const portfolioSnap = await portfolioRef.get();
    if (!portfolioSnap.exists) {
      // Return default portfolio structure
      const defaultPortfolio = {
        templateId: "minimalist",
        title: "",
        description: "",
        theme: {
          primaryColor: "#3b82f6",
          secondaryColor: "#64748b",
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
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await portfolioRef.set(defaultPortfolio);
      return NextResponse.json(defaultPortfolio);
    }

    const portfolioData = portfolioSnap.data();
    return NextResponse.json({
      id: portfolioSnap.id,
      ...portfolioData
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
    const decodedToken = await getAuth().verifyIdToken(token);
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
    const portfolioRef = db.collection('users').doc(userId).collection('portfolio').doc('site');

    // Check if portfolio exists for versioning
    const existingSnap = await portfolioRef.get();
    let version = 1;
    if (existingSnap.exists) {
      const existingData = existingSnap.data();
      version = (existingData?.version || 1) + 1;
    }

    const portfolioToSave = {
      ...portfolioData,
      userId,
      version,
      updatedAt: new Date(),
      ...(existingSnap.exists ? {} : { createdAt: new Date() })
    };

    await portfolioRef.set(portfolioToSave, { merge: true });

    // If portfolio is public and has a subdomain, update subdomain collection
    if (portfolioData.settings?.isPublic && portfolioData.subdomain) {
      const subdomainRef = db.collection('subdomains').doc(portfolioData.subdomain);

      // Check if subdomain is already taken by another user
      const existingSubdomain = await subdomainRef.get();
      if (existingSubdomain.exists) {
        const subdomainData = existingSubdomain.data();
        if (subdomainData?.userId !== userId) {
          return NextResponse.json(
            { error: 'Subdomain is already taken' },
            { status: 409 }
          );
        }
      }

      await subdomainRef.set({
        userId,
        portfolioId: 'site',
        subdomain: portfolioData.subdomain,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

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

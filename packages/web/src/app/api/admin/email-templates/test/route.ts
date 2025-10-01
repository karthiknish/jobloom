import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { defaultEmailTemplates } from "@/config/emailTemplates";

// Test endpoint without authentication for debugging
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing email templates API...');
    
    // Get templates from Firestore or return defaults
    const db = getAdminDb();
    const templatesRef = db.collection('emailTemplates');
    const templatesSnap = await templatesRef.get();
    
    if (templatesSnap.empty) {
      console.log('📝 Initializing default templates...');
      // Initialize with default templates
      const batch = db.batch();
      defaultEmailTemplates.forEach(template => {
        const docRef = templatesRef.doc(template.id);
        batch.set(docRef, {
          ...template,
          createdAt: template.createdAt.toISOString(),
          updatedAt: template.updatedAt.toISOString()
        });
      });
      await batch.commit();
      console.log('✅ Default templates initialized');
      
      return NextResponse.json({
        message: 'Default templates initialized',
        templates: defaultEmailTemplates
      });
    }

    const templates = templatesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ Found ${templates.length} templates`);

    return NextResponse.json({
      message: 'Templates retrieved successfully',
      templates: templates
    });

  } catch (error) {
    console.error('❌ Test API error:', error);
    return NextResponse.json(
      { 
        error: 'Test API failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
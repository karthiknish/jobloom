import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { defaultEmailTemplates, EmailTemplate } from "@/config/emailTemplates";
import { withApi, z } from "@/lib/api/withApi";

const emailTemplateCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['marketing', 'newsletter', 'onboarding', 'promotional', 'announcement']).optional(),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  variables: z.array(z.string()).optional(),
  preview: z.string().optional(),
  tags: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

export const GET = withApi({
  auth: "admin",
  rateLimit: "admin",
}, async () => {
  const db = getAdminDb();
  const templatesRef = db.collection('emailTemplates');
  const templatesSnap = await templatesRef.get();
  
  if (templatesSnap.empty) {
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
    
    return defaultEmailTemplates;
  }

  const templates = templatesSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return templates;
});

export const POST = withApi({
  auth: "admin",
  rateLimit: "admin",
  bodySchema: emailTemplateCreateSchema,
}, async ({ body }) => {
  const db = getAdminDb();
  const templateData = body;

  const templateRef = db.collection('emailTemplates').doc();
  const newTemplate: EmailTemplate = {
    id: templateRef.id,
    name: templateData.name,
    description: templateData.description || '',
    category: templateData.category || 'marketing',
    subject: templateData.subject,
    htmlContent: templateData.htmlContent,
    textContent: templateData.textContent || '',
    variables: templateData.variables || [],
    preview: templateData.preview || '',
    tags: templateData.tags || [],
    active: templateData.active ?? true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await templateRef.set({
    ...newTemplate,
    createdAt: newTemplate.createdAt.toISOString(),
    updatedAt: newTemplate.updatedAt.toISOString()
  });

  return newTemplate;
});

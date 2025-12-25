import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/firebase/admin";
import { withApi, z } from "@/lib/api/withApi";

const paramsSchema = z.object({
  id: z.string(),
});

const emailTemplateUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  subject: z.string().min(1).optional(),
  htmlContent: z.string().min(1).optional(),
  textContent: z.string().optional(),
  variables: z.array(z.string()).optional(),
  preview: z.string().optional(),
  tags: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

export const GET = withApi({
  auth: "admin",
  rateLimit: "admin",
  paramsSchema,
}, async ({ params }) => {
  const db = getAdminDb();
  const templateDoc = await db.collection('emailTemplates').doc(params.id).get();
  
  if (!templateDoc.exists) {
    throw { code: 'NOT_FOUND', message: 'Template not found', status: 404 };
  }

  return {
    id: templateDoc.id,
    ...templateDoc.data()
  };
});

export const PUT = withApi({
  auth: "admin",
  rateLimit: "admin",
  paramsSchema,
  bodySchema: emailTemplateUpdateSchema,
}, async ({ params, body }) => {
  const db = getAdminDb();
  const templateRef = db.collection('emailTemplates').doc(params.id);
  const templateDoc = await templateRef.get();
  
  if (!templateDoc.exists) {
    throw { code: 'NOT_FOUND', message: 'Template not found', status: 404 };
  }

  const updatedTemplate = {
    ...body,
    updatedAt: new Date().toISOString()
  };

  await templateRef.update(updatedTemplate);

  return {
    id: params.id,
    ...updatedTemplate
  };
});

export const DELETE = withApi({
  auth: "admin",
  rateLimit: "admin",
  paramsSchema,
}, async ({ params }) => {
  const db = getAdminDb();
  const templateRef = db.collection('emailTemplates').doc(params.id);
  const templateDoc = await templateRef.get();
  
  if (!templateDoc.exists) {
    throw { code: 'NOT_FOUND', message: 'Template not found', status: 404 };
  }

  await templateRef.delete();

  return { message: 'Template deleted successfully' };
});

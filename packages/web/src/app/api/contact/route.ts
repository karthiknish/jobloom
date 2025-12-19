import { withApi, z } from "@/lib/api/withApi";
import { getAdminDb } from "@/firebase/admin";
import { checkForSpam, recordSubmission } from "@/lib/spam-detection";

export const runtime = "nodejs";

const contactBodySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email format").max(254),
  message: z.string().min(1, "Message is required").max(5000),
  subject: z.string().max(500).optional(),
  honeypot: z.string().optional(),
  loadedAt: z.number().optional(),
  submittedAt: z.number().optional(),
});

const contactQuerySchema = z.object({
  status: z.enum(["pending", "resolved", "spam"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

function getClientIp(request: any): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "unknown";
}

export const POST = withApi({
  auth: 'none',
  rateLimit: 'general',
  rateLimitConfig: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  bodySchema: contactBodySchema,
}, async ({ body, request }) => {
  const ip = getClientIp(request);
  const { name, email, message, subject, honeypot, loadedAt, submittedAt } = body;

  const spamCheck = checkForSpam({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    message: message.trim(),
    subject: subject?.trim(),
    honeypot,
    loadedAt: loadedAt ? Number(loadedAt) : undefined,
    submittedAt: submittedAt ? Number(submittedAt) : Date.now(),
  }, ip);

  if (spamCheck.shouldBlock) {
    console.warn(`[Contact] Spam blocked from ${ip}:`, spamCheck.reasons);
    return {
      success: true,
      message: "Thank you for your message. We'll be in touch soon.",
      contactId: "blocked",
    };
  }

  recordSubmission(ip);
  const db = getAdminDb();
  const contactRef = db.collection('contacts').doc();
  
  const contactData = {
    id: contactRef.id,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    message: message.trim(),
    subject: subject?.trim() || "General Inquiry",
    status: spamCheck.isSpam ? "spam" : "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    spamScore: spamCheck.score,
    isSpam: spamCheck.isSpam,
    ip: ip !== "unknown" ? ip : undefined,
    ...(spamCheck.isSpam && spamCheck.reasons.length > 0 ? { spamReasons: spamCheck.reasons } : {}),
  };

  await contactRef.set(contactData);

  return {
    success: true,
    message: "Contact submission created successfully",
    contactId: contactRef.id
  };
});

export const GET = withApi({
  auth: 'admin',
  rateLimit: 'admin',
  querySchema: contactQuerySchema,
}, async ({ query }) => {
  const { status, limit, offset } = query;
  const db = getAdminDb();
  let firestoreQuery = db.collection('contacts').orderBy('createdAt', 'desc');
  
  if (status) {
    firestoreQuery = firestoreQuery.where('status', '==', status);
  }

  const snapshot = await firestoreQuery.limit(limit).offset(offset).get();
  const contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return {
    success: true,
    contacts,
    total: contacts.length
  };
});

export { OPTIONS } from "@/lib/api/withApi";

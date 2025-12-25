import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/firebase/admin";
import { withApi } from "@/lib/api/withApi";
import type { ContactSubmission } from "@/types/api";

// Zod schema for query parameters
const contactsAdminQuerySchema = z.object({
  status: z.string().max(50).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// GET /api/app/contacts/admin - Get all contact submissions (admin only)
export const GET = withApi({
  auth: "admin",
  rateLimit: "admin",
  querySchema: contactsAdminQuerySchema,
  handler: async ({ query }) => {
    const { status, limit, offset } = query;

    const db = getAdminDb();

    // Build query
    let dbQuery = db.collection('contacts').orderBy('createdAt', 'desc');

    if (status && status !== 'all') {
      dbQuery = dbQuery.where('status', '==', status);
    }

    // Apply pagination
    dbQuery = dbQuery.limit(limit);
    if (offset > 0) {
      dbQuery = dbQuery.offset(offset);
    }

    const snapshot = await dbQuery.get();

    const contacts: ContactSubmission[] = [];
    snapshot.forEach((doc) => {
      contacts.push({
        _id: doc.id,
        ...doc.data(),
      } as ContactSubmission);
    });

    // Get total count for pagination
    const totalQuery = status && status !== 'all'
      ? db.collection('contacts').where('status', '==', status)
      : db.collection('contacts');

    const totalSnapshot = await totalQuery.count().get();
    const total = totalSnapshot.data().count;

    return {
      contacts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  },
});

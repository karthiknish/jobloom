import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, verifyIdToken } from '@/firebase/admin';

const RESERVED = new Set([
  'www','app','admin','api','support','help','blog','cdn','static','assets','portal','hireall','dev','stage','test'
]);

function mask(error: string, debug?: any) {
  if (process.env.NODE_ENV === 'production') return { error };
  return { error, _debug: debug };
}

function normalize(name: string) {
  return name.trim().toLowerCase();
}

function validateFormat(name: string): string | null {
  if (!name) return 'Subdomain required';
  if (name.length < 3 || name.length > 30) return 'Must be 3-30 characters';
  if (!/^[a-z0-9-]+$/.test(name)) return 'Only lowercase letters, numbers, hyphen allowed';
  if (name.startsWith('-') || name.endsWith('-')) return 'Cannot start or end with hyphen';
  if (name.includes('--')) return 'Cannot contain consecutive hyphens';
  if (/^[0-9]+$/.test(name)) return 'Cannot be only numbers';
  if (RESERVED.has(name)) return 'Reserved name';
  return null;
}

// GET /api/subdomain?name=foo  -> availability
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = normalize(searchParams.get('name') || '');
    const formatErr = validateFormat(name);
    if (formatErr) {
      return NextResponse.json({ available: false, reason: formatErr });
    }
    const db = getAdminDb();
    const doc = await db.collection('subdomains').doc(name).get();
    return NextResponse.json({ available: !doc.exists });
  } catch (err: any) {
    return NextResponse.json(mask('Unable to check availability', { msg: err?.message }), { status: 500 });
  }
}

// POST /api/subdomain { subdomain }
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    let token: string | null = null;
    if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
    if (!token) {
      const cookieToken = req.cookies.get('token')?.value;
      if (cookieToken) token = cookieToken;
    }
    if (!token) return NextResponse.json(mask('Unauthorized'), { status: 401 });
    const decoded = await verifyIdToken(token);
    if (!decoded) return NextResponse.json(mask('Unauthorized'), { status: 401 });

    const body = await req.json().catch(() => null) as { subdomain?: string } | null;
    if (!body?.subdomain) return NextResponse.json(mask('subdomain required'), { status: 400 });
    const requested = normalize(body.subdomain);
    const formatErr = validateFormat(requested);
    if (formatErr) return NextResponse.json(mask(formatErr), { status: 400 });

    const db = getAdminDb();
    const userRef = db.collection('users').doc(decoded.uid);
    const subRef = db.collection('subdomains').doc(requested);

    let result: any = null;
    await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      const userData = userSnap.data() || {};
      if (userData.subdomain && userData.subdomain !== requested) {
        // Policy: no changes after initial claim
        throw new Error('Already claimed a subdomain');
      }
      const existing = await tx.get(subRef);
      if (existing.exists) throw new Error('Subdomain already taken');
      tx.set(subRef, { userId: decoded.uid, createdAt: new Date() });
      tx.set(userRef, { subdomain: requested, subdomainUpdatedAt: new Date() }, { merge: true });
      result = { subdomain: requested };
    });
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    const message = err?.message || 'Failed to claim subdomain';
    const status = /unauthorized/i.test(message) ? 401 : /taken|claimed/i.test(message) ? 409 : 400;
    return NextResponse.json(mask(message), { status });
  }
}

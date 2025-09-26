import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, verifyIdToken } from "@/firebase/admin";

// Shape mirrors the frontend ResumeData; kept permissive for now.
interface ResumeData {
  personalInfo: Record<string, any>;
  experience: any[];
  education: any[];
  skills: { category: string; skills: string[] }[];
  projects: any[];
}

interface ResumeDoc {
  id: string;
  templateId: string;
  resumeData: ResumeData;
  createdAt: string;
  updatedAt: string;
  version: number;
  visibility: "private" | "unlisted" | "public";
}

const PRIMARY_ID = "primary";

function maskError(message: string, devInfo?: any) {
  if (process.env.NODE_ENV === "production") {
    return { error: message };
  }
  return { error: message, _debug: devInfo };
}

async function getAuthUser(req: NextRequest) {
  // Expect Firebase ID token in Authorization: Bearer <token> or cookie "token"
  const authHeader = req.headers.get("authorization");
  let token: string | null = null;
  if (authHeader?.startsWith("Bearer ")) token = authHeader.slice(7);
  if (!token) {
    // Check cookie
    const cookieToken = req.cookies.get("token")?.value;
    if (cookieToken) token = cookieToken;
  }
  if (!token) return null;
  return await verifyIdToken(token);
}

function serialize(doc: FirebaseFirestore.DocumentSnapshot): ResumeDoc {
  const data = doc.data() as any;
  return {
    id: doc.id,
    templateId: data.templateId || "modern",
    resumeData: data.resumeData || getEmptyResume(),
    createdAt: data.createdAt?.toDate?.().toISOString?.() || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.().toISOString?.() || new Date().toISOString(),
    version: data.version || 1,
    visibility: data.visibility || "private",
  };
}

function getEmptyResume(): ResumeData {
  return {
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      website: "",
      summary: "",
    },
    experience: [
      {
        id: "1",
        company: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
        achievements: [""],
      },
    ],
    education: [
      {
        id: "1",
        institution: "",
        degree: "",
        field: "",
        graduationDate: "",
        gpa: "",
        honors: "",
      },
    ],
    skills: [
      { category: "Technical", skills: [] },
      { category: "Soft Skills", skills: [] },
      { category: "Languages", skills: [] },
    ],
    projects: [
      {
        id: "1",
        name: "",
        description: "",
        technologies: [],
        link: "",
        github: "",
      },
    ],
  };
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(maskError("Unauthorized"), { status: 401 });
    }
    const db = getAdminDb();
    const ref = db.collection("users").doc(authUser.uid).collection("resumes").doc(PRIMARY_ID);
    const snap = await ref.get();
    if (!snap.exists) {
      const empty = getEmptyResume();
      const now = new Date();
      await ref.set({
        templateId: "modern",
        resumeData: empty,
        visibility: "private",
        version: 1,
        createdAt: now,
        updatedAt: now,
      });
      const newSnap = await ref.get();
      return NextResponse.json(serialize(newSnap));
    }
    return NextResponse.json(serialize(snap));
  } catch (err: any) {
    return NextResponse.json(
      maskError("Could not load resume", { code: err?.code, message: err?.message }) ,
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json(maskError("Unauthorized"), { status: 401 });
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(maskError("Invalid payload"), { status: 400 });
    }
    const { templateId, resumeData, version } = body as Partial<ResumeDoc> & { resumeData: ResumeData };
    if (!resumeData) {
      return NextResponse.json(maskError("Missing resumeData"), { status: 400 });
    }
    const db = getAdminDb();
    const ref = db.collection("users").doc(authUser.uid).collection("resumes").doc(PRIMARY_ID);
    const snap = await ref.get();
    let nextVersion = 1;
    if (snap.exists) {
      const current = snap.data() as any;
      const currentVersion = current.version || 1;
      if (version && version !== currentVersion) {
        return NextResponse.json(maskError("Version conflict"), { status: 409 });
      }
      nextVersion = currentVersion + 1;
    }
    const now = new Date();
    await ref.set(
      {
        templateId: templateId || "modern",
        resumeData,
        visibility: "private",
        version: nextVersion,
        updatedAt: now,
        createdAt: snap.exists ? (snap.data() as any).createdAt || now : now,
      },
      { merge: true }
    );
    const updated = await ref.get();
    return NextResponse.json(serialize(updated));
  } catch (err: any) {
    return NextResponse.json(
      maskError("Could not save resume", { code: err?.code, message: err?.message }),
      { status: 500 }
    );
  }
}

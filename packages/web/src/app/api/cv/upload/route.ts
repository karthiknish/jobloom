import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex-generated/api";

export async function POST(req: NextRequest) {
  try {
    // Create a Convex HTTP client inside the function
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const targetRole = formData.get("targetRole") as string;
    const industry = formData.get("industry") as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: "Missing file or userId" },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files.",
        },
        { status: 400 },
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 },
      );
    }

    // Get user from Convex
    const user = await convex.query(api.users.getUserByClerkId, {
      clerkId: userId,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Extract text from file
    let cvText = "";
    const buffer = await file.arrayBuffer();

    try {
      if (file.type === "application/pdf") {
        // Import pdf-parse dynamically inside the function
        const pdf = (await import("pdf-parse")).default;
        const pdfData = await pdf(Buffer.from(buffer));
        cvText = pdfData.text;
      } else if (file.type === "text/plain") {
        cvText = new TextDecoder().decode(buffer);
      } else {
        // For DOC/DOCX files, we'll need a more sophisticated parser
        // For now, return an error asking for PDF or TXT
        return NextResponse.json(
          {
            error:
              "DOC/DOCX support coming soon. Please upload PDF or TXT files.",
          },
          { status: 400 },
        );
      }
    } catch (extractError) {
      console.error("Error extracting text from file:", extractError);
      return NextResponse.json(
        { error: "Failed to extract text from file" },
        { status: 500 },
      );
    }

    if (!cvText.trim()) {
      return NextResponse.json(
        { error: "No text content found in the file" },
        { status: 400 },
      );
    }

    // Create CV analysis record
    const analysisId = await convex.mutation(api.cvAnalysis.createCvAnalysis, {
      userId: user._id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      cvText: cvText.trim(),
    });

    // Start analysis in background
    try {
      await fetch(`${req.nextUrl.origin}/api/cv/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysisId,
          cvText: cvText.trim(),
          targetRole,
          industry,
        }),
      });
    } catch (analysisError) {
      console.error("Error starting analysis:", analysisError);
      // Don't fail the upload, just log the error
    }

    return NextResponse.json({
      success: true,
      analysisId,
      message: "CV uploaded successfully. Analysis in progress...",
    });
  } catch (error) {
    console.error("Error uploading CV:", error);
    return NextResponse.json({ error: "Failed to upload CV" }, { status: 500 });
  }
}

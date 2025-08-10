// app/api/convex/jobs/import/route.ts
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@jobloom/convex/convex/_generated/api";
import { Id } from "@jobloom/convex/convex/_generated/dataModel";

export async function POST(request: Request) {
  try {
    // Check if the environment variable is defined
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not defined");
    }
    
    // Create a Convex HTTP client inside the function
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    const body = await request.json();
    const { userId, jobs } = body;

    if (!userId || !jobs || !Array.isArray(jobs)) {
      return NextResponse.json(
        { error: "Missing required fields: userId and jobs array" },
        { status: 400 },
      );
    }

    // Import jobs from CSV
    const result = await convex.mutation(api.jobs.importJobsFromCSV, {
      userId: userId as Id<"users">,
      jobs,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error importing jobs:", error);
    return NextResponse.json(
      { error: "Failed to import jobs" },
      { status: 500 },
    );
  }
}
// app/api/convex/jobs/import-api/route.ts
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
    const { userId, source, searchQuery, location } = body;

    if (!userId || !source) {
      return NextResponse.json(
        { error: "Missing required fields: userId and source" },
        { status: 400 },
      );
    }

    // Import jobs from API
    const result = await convex.mutation(api.jobs.importJobsFromAPI, {
      userId: userId as Id<"users">,
      source,
      searchQuery,
      location,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error importing jobs from API:", error);
    return NextResponse.json(
      { error: "Failed to import jobs from API" },
      { status: 500 },
    );
  }
}
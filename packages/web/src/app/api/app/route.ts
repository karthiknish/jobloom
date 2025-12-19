import { withApi } from "@/lib/api/withApi";

// Main API route handler for /api/app
export const GET = withApi({}, async () => {
  return {
    message: "Hireall API is running",
    version: "1.0.0",
    status: "healthy",
    timestamp: Date.now(),
    endpoints: [
      "/api/app/users",
      "/api/app/jobs",
      "/api/app/applications",
      "/api/app/sponsorship",
      "/api/app/cv-analysis",
      "/api/app/admin"
    ],
    documentation: {
      baseUrl: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://hireall.app',
      version: "1.0.0",
      status: "active"
    }
  };
});

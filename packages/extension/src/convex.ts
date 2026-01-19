import { ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || "https://amicable-chickadee-57.convex.cloud";

let client: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
  if (!client) {
    client = new ConvexHttpClient(convexUrl);
  }
  return client;
}

export function setConvexAuthToken(token: string | null) {
  const convex = getConvexClient();
  convex.setAuth(token ?? "");
}

export function getConvexUrl(): string {
  return convexUrl;
}

export async function executeConvexQuery<Args extends Record<string, any>>(
  functionName: string,
  args: Args
): Promise<any> {
  const convex = getConvexClient();
  return (convex as any).query(functionName, args);
}

export async function executeConvexMutation<Args extends Record<string, any>>(
  functionName: string,
  args: Args
): Promise<any> {
  const convex = getConvexClient();
  return (convex as any).mutation(functionName, args);
}

export async function executeConvexAction<Args extends Record<string, any>>(
  functionName: string,
  args: Args
): Promise<any> {
  const convex = getConvexClient();
  return (convex as any).action(functionName, args);
}

import { betterAuth } from "better-auth";
import { convexAdapter } from "./adapter";
import { ActionCtx } from "./_generated/server";
import { oidcProvider, bearer } from "better-auth/plugins";

export function getAuth(ctx: ActionCtx) {
  return betterAuth({
    database: convexAdapter(ctx),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        enabled: true,
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    plugins: [
      bearer(),
      oidcProvider({
        loginPage: "/sign-in",
      }),
    ],
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.CONVEX_SITE_URL,
  });
}

export async function getUserId(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  return identity.subject;
}

export const auth = { getUserId };

/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as admin from "../admin.js";
import type * as applications from "../applications.js";
import type * as clerkWebhook from "../clerkWebhook.js";
import type * as contacts from "../contacts.js";
import type * as cvAnalysis from "../cvAnalysis.js";
import type * as jobs from "../jobs.js";
import type * as rateLimiting from "../rateLimiting.js";
import type * as sponsorship from "../sponsorship.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  applications: typeof applications;
  clerkWebhook: typeof clerkWebhook;
  contacts: typeof contacts;
  cvAnalysis: typeof cvAnalysis;
  jobs: typeof jobs;
  rateLimiting: typeof rateLimiting;
  sponsorship: typeof sponsorship;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

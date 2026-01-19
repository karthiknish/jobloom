import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { getAuth } from "./auth";

const http = httpRouter();

http.route({
  pathPrefix: "/api/auth",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    return await getAuth(ctx).handler(request);
  }),
});

http.route({
  pathPrefix: "/api/auth",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    return await getAuth(ctx).handler(request);
  }),
});

export default http;

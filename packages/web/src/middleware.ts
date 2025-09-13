import { NextResponse } from "next/server";

export function middleware() {
  // No-op auth middleware; routes can enforce auth via server actions or client checks.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};

"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <SignIn
        path="/sign-in"
        routing="path"
        redirectUrl="/dashboard"
        signUpUrl="/sign-up"
      />
    </main>
  );
}

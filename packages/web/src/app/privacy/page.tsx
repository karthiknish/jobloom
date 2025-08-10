import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy | Jobloom",
  description: "Learn how Jobloom collects, uses, and safeguards your data.",
};

export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          <CardDescription>Last updated: June 28, 2025</CardDescription>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <section className="space-y-6">
            <p>
              Your privacy is important to us. This Privacy Policy explains how
              Jobloom (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
              collects, uses, and protects your personal information when you
              use our website, Chrome extension, and related services
              (collectively, the &quot;Service&quot;).
            </p>

            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <p>
              We collect information you provide directly, such as your name and
              email address when you create an account. We also automatically
              collect certain information when you use the Service, such as log
              data and device information. Our Chrome extension may collect the
              URLs of job listings you visit to identify sponsored postings.
            </p>

            <h2 className="text-xl font-semibold">2. How We Use Information</h2>
            <p>
              We use your information to deliver and improve the Service,
              provide customer support, and communicate updates. We never sell
              your data.
            </p>

            <h2 className="text-xl font-semibold">3. Data Security</h2>
            <p>
              We employ industry-standard security measures—encryption in
              transit and at rest—to protect your data from unauthorized access.
            </p>

            <h2 className="text-xl font-semibold">4. Your Choices</h2>
            <p>
              You may access, update, or delete your personal information at any
              time from your account dashboard or by contacting us.
            </p>

            <h2 className="text-xl font-semibold">5. Contact Us</h2>
            <p>
              If you have questions about this policy, email us at
              <Link
                href="mailto:privacy@jobloom.ai"
                className="text-indigo-600 hover:underline"
              >
                {" "}
                privacy@jobloom.ai
              </Link>
              .
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  );
}

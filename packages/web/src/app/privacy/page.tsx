import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Eye,
  Lock,
  Users,
  Database,
  Cookie,
  Mail,
  Phone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <head>
        <title>Privacy Policy | Hireall</title>
        <meta
          name="description"
          content="Learn how Hireall collects, uses, and safeguards your data. Your privacy matters to us."
        />
        <meta
          name="keywords"
          content="privacy policy, data protection, GDPR, CCPA, Hireall privacy"
        />
      </head>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          <CardDescription>Last updated: June 28, 2025</CardDescription>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <section className="space-y-6">
            <p>
              Your privacy is important to us. This Privacy Policy explains how
              Hireall (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) collects, uses, and protects your personal information when you use our website, Chrome extension, and related services (collectively, the &ldquo;Service&rdquo;).
            </p>

            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <p>
              We collect information you provide directly, such as your name and email address when you create an account. We also automatically collect certain information when you use the Service, such as log data and device information. Our Chrome extension may collect the URLs of job listings you visit to identify sponsored postings.
            </p>

            <h2 className="text-xl font-semibold">2. How We Use Information</h2>
            <p>
              We use your information to deliver and improve the Service, provide customer support, and communicate updates. We never sell your data.
            </p>

            <h2 className="text-xl font-semibold">3. Data Security</h2>
            <p>
              We employ industry-standard security measures—encryption in transit and at rest—to protect your data from unauthorized access.
            </p>

            <h2 className="text-xl font-semibold">4. Your Choices</h2>
            <p>
              You may access, update, or delete your personal information at any time from your account dashboard or by contacting us.
            </p>

            <h2 className="text-xl font-semibold">5. Contact Us</h2>
            <p>
              If you have questions about this policy, email us at
              <Link
                href="mailto:privacy@hireall.app"
                className="text-primary hover:underline"
              >
                {" "}
                privacy@hireall.app
              </Link>
              .
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  );
}

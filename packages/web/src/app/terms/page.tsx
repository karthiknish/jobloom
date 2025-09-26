import type { Metadata } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Scale,
  FileCheck,
  Shield,
  Users,
  AlertCircle,
  CheckCircle2,
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

export const metadata: Metadata = {
  title: "Terms of Service | Hireall",
  description:
    "Review the comprehensive terms that govern your use of Hireall services.",
  keywords:
    "terms of service, terms and conditions, legal agreement, Hireall terms",
};

export default function TermsOfService() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Terms of Service</CardTitle>
          <CardDescription>Last updated: June 28, 2025</CardDescription>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <section className="space-y-6">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using the Hireall service (the
              &quot;Service&quot;), you agree to be bound by these Terms of Service
              (&quot;Terms&quot;). If you do not agree to these Terms, do not use
              the Service.
            </p>

            <h2 className="text-xl font-semibold">2. Use of Service</h2>
            <p>
              You may use the Service only for lawful purposes and in accordance
              with these Terms. You are responsible for your account credentials and
              all activity under your account.
            </p>

            <h2 className="text-xl font-semibold">3. User Accounts</h2>
            <p>
              You must provide accurate information when creating an account and
              keep your account information current. You are responsible for
              maintaining the confidentiality of your account and password.
            </p>

            <h2 className="text-xl font-semibold">4. Data Collection and Use</h2>
            <p>
              Our collection and use of personal information is described in our
              Privacy Policy. By using the Service, you consent to the collection
              and use of your information as described in the Privacy Policy.
            </p>

            <h2 className="text-xl font-semibold">5. Job Data</h2>
            <p>
              You are responsible for the accuracy and legality of any job data you
              input into the Service. We reserve the right to remove any content
              that violates these Terms or is otherwise inappropriate.
            </p>

            <h2 className="text-xl font-semibold">6. Intellectual Property</h2>
            <p>
              The Service and its entire contents, features, and functionality are
              owned by Hireall and are protected by international copyright,
              trademark, patent, trade secret, and other intellectual property or
              proprietary rights laws.
            </p>

            <h2 className="text-xl font-semibold">7. Disclaimer of Warranties</h2>
            <p>
              The Service is provided on an &quot;as is&quot; and &quot;as available&quot;
              basis. We make no warranties of any kind, either express or implied,
              including but not limited to warranties of merchantability, fitness
              for a particular purpose, or non-infringement.
            </p>

            <h2 className="text-xl font-semibold">8. Limitation of Liability</h2>
            <p>
              In no event shall Hireall be liable for any indirect, incidental,
              special, consequential, or punitive damages, including without
              limitation, loss of profits, data, use, goodwill, or other intangible
              losses, resulting from your access to or use of or inability to
              access or use the Service.
            </p>

            <h2 className="text-xl font-semibold">9. Changes to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time.
              Your continued use of the Service after any such changes constitutes
              your acceptance of the new Terms.
            </p>

            <h2 className="text-xl font-semibold">10. Contact Information</h2>
            <p>
              For questions about these Terms, email us at
              <Link href="mailto:legal@hireall.app" className="text-primary">
                {" "}
                legal@hireall.app
              </Link>
              .
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  );
}
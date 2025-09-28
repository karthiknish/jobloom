import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Shield, ClipboardList, AlertTriangle, FileText, HelpCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TermsOfService() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <head>
        <title>Terms of Service | Hireall</title>
        <meta
          name="description"
          content="Review the Terms of Service that govern your use of Hireall's job tracking platform and Chrome extension."
        />
        <meta
          name="keywords"
          content="terms of service, user agreement, Hireall terms"
        />
      </head>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Terms of Service</CardTitle>
          <CardDescription>Last updated: June 28, 2025</CardDescription>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <section className="space-y-6">
            <p>
              Welcome to Hireall! These Terms of Service ("Terms") govern your use of the Hireall platform, Chrome extension, and related services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms.
            </p>

            <h2 className="text-xl font-semibold">1. Eligibility</h2>
            <p>
              You must be at least 18 years old to use the Service. By using the Service, you represent that you meet this eligibility requirement.
            </p>

            <h2 className="text-xl font-semibold">2. Account Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>

            <h2 className="text-xl font-semibold">3. Acceptable Use</h2>
            <p>
              You agree not to misuse the Service, including attempting to gain unauthorized access or interfering with the operation of the Service.
            </p>

            <h2 className="text-xl font-semibold">4. Chrome Extension Usage</h2>
            <p>
              The Hireall Chrome extension highlights sponsored job listings. By installing the extension, you grant it permission to read the job listings you visit to provide this functionality.
            </p>

            <h2 className="text-xl font-semibold">5. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Service at any time if you violate these Terms.
            </p>

            <h2 className="text-xl font-semibold">6. Contact</h2>
            <p>
              If you have questions about these Terms, please contact us at
              <Link
                href="mailto:support@hireall.app"
                className="text-primary hover:underline"
              >
                {" "}
                support@hireall.app
              </Link>
              .
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  );
}
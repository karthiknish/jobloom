import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Jobloom",
  description: "Review the terms that govern your use of Jobloom.",
};

export default function TermsOfService() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="mb-4 text-sm text-gray-500">Last updated: June 28, 2025</p>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
        <p>
          By creating an account or using the Jobloom service (the
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

        <h2 className="text-xl font-semibold">3. Intellectual Property</h2>
        <p>
          All content, trademarks, and data on the Service are the property of
          Jobloom or its licensors. You may not copy, modify, or distribute any
          part of the Service without prior written consent.
        </p>

        <h2 className="text-xl font-semibold">4. Termination</h2>
        <p>
          We may suspend or terminate your access to the Service at any time for
          any reason, including violation of these Terms.
        </p>

        <h2 className="text-xl font-semibold">5. Disclaimers</h2>
        <p>
          The Service is provided &quot;as is&quot; without warranties of any
          kind. We do not guarantee that the Service will be uninterrupted or
          error-free.
        </p>

        <h2 className="text-xl font-semibold">6. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Jobloom shall not be liable
          for any indirect, incidental, or consequential damages arising out of
          or related to your use of the Service.
        </p>

        <h2 className="text-xl font-semibold">7. Governing Law</h2>
        <p>
          These Terms are governed by the laws of California, USA, without
          regard to its conflict of law provisions.
        </p>

        <h2 className="text-xl font-semibold">8. Contact Us</h2>
        <p>
          For questions about these Terms, email us at
          <Link href="mailto:legal@jobloom.ai" className="text-indigo-600">
            {" "}
            legal@jobloom.ai
          </Link>
          .
        </p>
      </section>
    </main>
  );
}

import type { Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import FirebaseInitializer from "@/components/FirebaseInitializer";
import { FirebaseAuthProvider } from "@/providers/firebase-auth-provider";
import { SubscriptionProvider } from "@/providers/subscription-provider";
import { AppToaster } from "@/components/ui/Toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileNavigation from "@/components/MobileNavigation";
import { AnalyticsProvider } from "@/providers/analytics-provider";
import { PerformanceProvider } from "@/providers/performance-provider";
import { JsonLd } from "@/components/JsonLd";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { ReportIssue } from "@/components/ReportIssue";
import { rootMetadata } from "@/metadata";
import { OnboardingTourProvider } from "@/providers/onboarding-tour-provider";
import { SuccessAnimationProvider } from "@/components/ui/SuccessAnimation";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
} from "@/lib/structured-data";

// Export server-side metadata for SSR
export const metadata = rootMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Generate JSON-LD schemas
const organizationSchema = generateOrganizationSchema();
const webSiteSchema = generateWebSiteSchema();

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data - renders server-side for SEO */}
        <JsonLd data={organizationSchema} />
        <JsonLd data={webSiteSchema} />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${playfair.variable} antialiased safe-area-inset-top safe-area-inset-left safe-area-inset-right font-sans layout-with-mobile-nav-padding`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        <FirebaseInitializer />
        <FirebaseAuthProvider>
          <SubscriptionProvider>
            <AnalyticsProvider>
              <PerformanceProvider>
                <OnboardingTourProvider>
                  <SuccessAnimationProvider>
                    <Header />
                    <EmailVerificationBanner />
                    <main id="main">{children}</main>
                    <Footer />
                    <MobileNavigation />
                    <AppToaster />
                    <ReportIssue position="bottom-left" />
                  </SuccessAnimationProvider>
                </OnboardingTourProvider>
              </PerformanceProvider>
            </AnalyticsProvider>
          </SubscriptionProvider>
        </FirebaseAuthProvider>
      </body>
    </html>
  );
}

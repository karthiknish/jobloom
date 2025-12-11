import type { Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import FirebaseInitializer from "@/components/FirebaseInitializer";
import { FirebaseAuthProvider } from "@/providers/firebase-auth-provider";
import { SubscriptionProvider } from "@/providers/subscription-provider";
import { AppToaster } from "@/components/ui/Toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import MobileNavigation from "@/components/MobileNavigation";
import { AnalyticsProvider } from "@/providers/analytics-provider";
import { PerformanceProvider } from "@/providers/performance-provider";
import { SeoHead } from "@/components/SeoHead";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { ReportIssue } from "@/components/ReportIssue";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <SeoHead />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased safe-area-inset-top safe-area-inset-bottom safe-area-inset-left safe-area-inset-right font-inter"
      >
        <FirebaseInitializer />
        <FirebaseAuthProvider>
          <SubscriptionProvider>
            <AnalyticsProvider>
              <PerformanceProvider>
                <Header />
                <EmailVerificationBanner />
                {children}
                <Footer />
                <MobileNavigation />
                <AppToaster />
                <Chatbot />
                <ReportIssue position="bottom-left" />
              </PerformanceProvider>
            </AnalyticsProvider>
          </SubscriptionProvider>
        </FirebaseAuthProvider>
      </body>
    </html>
  );
}

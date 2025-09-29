import type { Viewport } from "next";
import "./globals.css";
import FirebaseInitializer from "@/components/FirebaseInitializer";
import { FirebaseAuthProvider } from "@/providers/firebase-auth-provider";
import { AppToaster } from "@/components/ui/Toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import MobileNavigation from "@/components/MobileNavigation";
import { AnalyticsProvider } from "@/providers/analytics-provider";
import { resolveSeoMeta } from "@/seo.config";
import React from "react";

const baseMeta = resolveSeoMeta("/");

function SeoHead() {
  const [meta, setMeta] = React.useState(baseMeta);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setMeta(resolveSeoMeta(window.location.pathname));
    }
  }, []);

  return (
    <>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      {meta.keywords && <meta name="keywords" content={meta.keywords} />}
      {meta.noIndex ? (
        <meta name="robots" content="noindex,nofollow" />
      ) : (
        <meta name="robots" content="index,follow" />
      )}
      <meta name="theme-color" content="#4CAF50" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="HireAll" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
        rel="stylesheet"
      />
    </>
  );
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <SeoHead />
      </head>
      <body className="antialiased safe-area-inset-top safe-area-inset-bottom safe-area-inset-left safe-area-inset-right font-inter">
        <FirebaseInitializer />
        <FirebaseAuthProvider>
          <AnalyticsProvider>
            <Header />
            {children}
            <Footer />
            <MobileNavigation />
            <AppToaster />
            <Chatbot />
          </AnalyticsProvider>
        </FirebaseAuthProvider>
      </body>
    </html>
  );
}

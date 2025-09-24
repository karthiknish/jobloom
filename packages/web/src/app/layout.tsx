import type { Metadata } from "next";
import "./globals.css";
import { FirebaseAuthProvider } from "@/providers/firebase-auth-provider";
import { AppToaster } from "@/components/ui/Toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import MobileNavigation from "@/components/MobileNavigation";
import { inter } from "@/font";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "JobloomMonorepo - Job Tracker",
  description: "Track your job applications and highlight sponsored roles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.className} antialiased`}
        style={{ colorScheme: "light" as const }}
      >
        <ThemeProvider>
          <FirebaseAuthProvider>
            <Header />
            {children}
            <Footer />
            <MobileNavigation />
            <AppToaster />
            <Chatbot />
          </FirebaseAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
